#!/bin/bash
# Local LMS instances for checking exported packages in the real thing.
#
#   docker/lms/lms.sh up <target>             start (installs on first run)
#   docker/lms/lms.sh down <target>           stop and delete, data included
#   docker/lms/lms.sh test <target> <zip>...  import, run every package twice, report
#                                             (lrs: run xAPI exports against the LRS)
#   docker/lms/lms.sh stored <target>         what the LMS stored for the last runs
#   docker/lms/lms.sh list                    targets, ports and logins
#
# Needs docker (with compose) and, for `test`, `npm install` in the repository.
set -e

LMS=$(cd "$(dirname "$0")" && pwd)
CACHE=$LMS/.cache
PASSWORD='LiaTest-2026'

usage() { sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }

list() {
  cat <<EOF
target      url                       login
moodle311   http://localhost:8311     admin / $PASSWORD
moodle405   http://localhost:8405     admin / $PASSWORD
moodle500   http://localhost:8500     admin / $PASSWORD
ilias9      http://localhost:8909     root / $PASSWORD
ilias10     http://localhost:8910     root / $PASSWORD
ilias11     http://localhost:8911     root / $PASSWORD
openolat    http://localhost:8970     administrator / $PASSWORD-oo
lrs         http://localhost:8090     admin / $PASSWORD (xAPI: http://localhost:8090/xapi)
EOF
}

# --- Moodle, on the official moodlehq/moodle-docker ---------------------------

moodle_env() {
  local ver=$1 php dbver
  case $ver in
    311) php=7.4 dbver=13 ;;
    405) php=8.3 dbver=17 ;;
    500) php=8.3 dbver=17 ;;
    *) echo "unknown Moodle version $ver (311, 405, 500)"; exit 1 ;;
  esac
  export COMPOSE_PROJECT_NAME=lia-moodle$ver
  export MOODLE_DOCKER_WWWROOT=$CACHE/moodle$ver
  export MOODLE_DOCKER_DB=pgsql
  export MOODLE_DOCKER_DB_VERSION=$dbver
  export MOODLE_DOCKER_PHP_VERSION=$php
  export MOODLE_DOCKER_WEB_PORT=127.0.0.1:8$ver
  MOODLE_COMPOSE=$CACHE/moodle-docker/bin/moodle-docker-compose
}

moodle_up() {
  local ver=$1
  mkdir -p "$CACHE"
  [ -d "$CACHE/moodle-docker" ] || git clone -q --depth 1 https://github.com/moodlehq/moodle-docker.git "$CACHE/moodle-docker"
  [ -d "$CACHE/moodle$ver" ] || git clone -q --depth 1 --branch "MOODLE_${ver}_STABLE" https://github.com/moodle/moodle.git "$CACHE/moodle$ver"
  moodle_env "$ver"
  [ -f "$MOODLE_DOCKER_WWWROOT/config.php" ] || cp "$CACHE/moodle-docker/config.docker-template.php" "$MOODLE_DOCKER_WWWROOT/config.php"
  $MOODLE_COMPOSE up -d
  "$CACHE/moodle-docker/bin/moodle-docker-wait-for-db"
  if [ ! -f "$CACHE/.installed-moodle$ver" ]; then
    $MOODLE_COMPOSE exec -T webserver php admin/cli/install_database.php --agree-license \
      --fullname="LiaScript Test $ver" --shortname="lia$ver" --summary="SCORM tests" \
      --adminuser=admin --adminpass="$PASSWORD" --adminemail=admin@example.com </dev/null
    touch "$CACHE/.installed-moodle$ver"
  fi
}

moodle_down() {
  moodle_env "$1"
  $MOODLE_COMPOSE down -v
  rm -f "$CACHE/.installed-moodle$1"
}

# Prints the course module id of each imported package, one per line
moodle_import() {
  local ver=$1; shift
  moodle_env "$ver"
  $MOODLE_COMPOSE cp "$LMS/moodle/addscorm.php" webserver:/tmp/addscorm.php >/dev/null 2>&1
  for zip in "$@"; do
    local name; name=$(basename "$zip" .zip)
    $MOODLE_COMPOSE cp "$zip" "webserver:/tmp/$name.zip" >/dev/null 2>&1
    $MOODLE_COMPOSE exec -T webserver php /tmp/addscorm.php "/tmp/$name.zip" "$name" LIATEST </dev/null | tail -1
  done
}

moodle_stored() {
  moodle_env "$1"
  local sql
  if [ "$1" = 311 ]; then
    sql="select s.name, t.element, left(t.value, 50) from m_scorm_scoes_track t
         join m_scorm s on s.id = t.scormid
         where t.element ~ '(status|score\.(raw|scaled)|location)$' order by s.id, t.element"
  else
    sql="select s.name, e.element, left(v.value, 50) from m_scorm_scoes_value v
         join m_scorm_element e on e.id = v.elementid
         join m_scorm_attempt a on a.id = v.attemptid
         join m_scorm s on s.id = a.scormid
         where e.element ~ '(status|score\.(raw|scaled)|location)$' order by s.id, e.element"
  fi
  $MOODLE_COMPOSE exec -T db psql -U moodle -d moodle -At -F ' | ' -c "$sql" </dev/null
}

# --- ILIAS, srsolutions/ilias --------------------------------------------------

ilias_compose() {
  local ver=$1; shift
  case $ver in 9|10|11) ;; *) echo "unknown ILIAS version $ver (9, 10, 11)"; exit 1 ;; esac
  ILIAS_VERSION=$ver ILIAS_PORT=89$(printf %02d "$ver") ILIAS_ROOT_PASSWORD=$PASSWORD \
    docker compose -f "$LMS/ilias/compose.yml" -p "lia-ilias$ver" "$@"
}

ilias_up() {
  ilias_compose "$1" up -d
  wait_for "http://localhost:89$(printf %02d "$1")/login.php" 1200
  # Without learning progress ILIAS runs packages as "no-credit" and discards
  # their status and score
  ilias_compose "$1" exec -T mysql mariadb -uroot -pexample ilias -e \
    "update settings set value = '1' where module = 'common' and keyword in ('enable_tracking', 'save_user_related_data')" </dev/null
}

ilias_stored() {
  ilias_compose "$1" exec -T mysql mariadb -uroot -pexample ilias -e "
    select o.title, t.lvalue, left(t.rvalue, 50) value from scorm_tracking t
      join object_data o on o.obj_id = t.obj_id order by o.obj_id, t.lvalue;
    select o.title, s.status, s.percentage_completed from sahs_user s
      join object_data o on o.obj_id = s.obj_id;
    select o.title, n.completion_status, n.success_status, n.scaled, n.c_raw, n.location from cmi_node n
      join cp_node c on c.cp_node_id = n.cp_node_id join object_data o on o.obj_id = c.slm_id" </dev/null
}

# --- OpenOlat, frentix/openolat ------------------------------------------------

openolat_compose() {
  docker compose -f "$LMS/openolat/compose.yml" -p lia-openolat "$@"
}

openolat_up() {
  local image=frentix/openolat:19.1.6
  local schema=$CACHE/openolat/setupDatabase.sql
  if [ ! -f "$schema" ]; then
    # The image ships no database; its schema sits inside the OpenOlat jar
    mkdir -p "$CACHE/openolat"
    docker pull -q "$image" >/dev/null
    local container; container=$(docker create "$image")
    local jar; jar=$(docker run --rm --entrypoint sh "$image" -c 'ls /home/openolat/webapp/WEB-INF/lib/openolat-lms-*.jar' | head -1)
    docker cp "$container:$jar" "$CACHE/openolat/openolat.jar" >/dev/null
    docker rm "$container" >/dev/null
    unzip -p "$CACHE/openolat/openolat.jar" database/postgresql/setupDatabase.sql > "$schema"
    rm -f "$CACHE/openolat/openolat.jar"
  fi
  openolat_compose up -d
  wait_for "http://localhost:8970/" 600
}

openolat_stored() {
  # OpenOlat keeps SCORM tracking as files in the user's home
  openolat_compose exec -T openolat sh -c \
    'find /home/openolat/olatdata -path "*scorm*" -name "*.xml" -newer /home/openolat/start.sh 2>/dev/null | head -20 | while read f; do echo "== $f"; grep -oE "<(lesson_status|score_raw|lesson_location|cmi.core.[a-z_.]+)[^<]*" "$f" | head; done' </dev/null
}

# --- xAPI learning record store, yetanalytics/lrsql -----------------------------

lrs_compose() {
  LRS_PASSWORD=$PASSWORD docker compose -f "$LMS/lrs/compose.yml" -p lia-lrs "$@"
}

# --- helpers --------------------------------------------------------------------

wait_for() {
  local url=$1 seconds=$2
  for ((i = 0; i < seconds; i += 10)); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' -m 5 -L "$url")" = 200 ] && { echo "ready: $url"; return 0; }
    sleep 10
  done
  echo "not ready after ${seconds}s: $url"
  return 1
}

url_of() {
  case $1 in
    moodle*) echo "http://localhost:8${1#moodle}" ;;
    ilias*) echo "http://localhost:89$(printf %02d "${1#ilias}")" ;;
    openolat) echo "http://localhost:8970" ;;
    lrs) echo "http://localhost:8090" ;;
  esac
}

cmd=$1 target=$2
[ -n "$cmd" ] || usage
[ "$cmd" = list ] && { list; exit 0; }
[ -n "$target" ] || usage
shift 2

case "$cmd:$target" in
  up:moodle*) moodle_up "${target#moodle}" ;;
  down:moodle*) moodle_down "${target#moodle}" ;;
  stored:moodle*) moodle_stored "${target#moodle}" ;;
  test:moodle*)
    mapfile -t cmids < <(moodle_import "${target#moodle}" "$@")
    node "$LMS/e2e/run.mjs" moodle "$(url_of "$target")" "${cmids[@]}"
    ;;

  up:ilias*) ilias_up "${target#ilias}" ;;
  down:ilias*) ilias_compose "${target#ilias}" down -v ;;
  stored:ilias*) ilias_stored "${target#ilias}" ;;
  test:ilias*) node "$LMS/e2e/run.mjs" ilias "$(url_of "$target")" "$@" ;;

  up:openolat) openolat_up ;;
  down:openolat) openolat_compose down -v ;;
  stored:openolat) openolat_stored ;;
  test:openolat) node "$LMS/e2e/run.mjs" openolat "$(url_of "$target")" "$@" ;;

  up:lrs) lrs_compose up -d && wait_for "http://localhost:8090/health" 120 ;;
  down:lrs) lrs_compose down -v ;;
  test:lrs)
    # an xAPI export built with --xapi-endpoint http://localhost:8090/xapi and
    # --xapi-auth "Basic $(printf 'liatest:LiaTest-2026' | base64)"
    for pkg in "$@"; do node "$LMS/e2e/xapi.mjs" "$(url_of lrs)" "$pkg" liatest "$PASSWORD"; done
    ;;

  *) usage ;;
esac
