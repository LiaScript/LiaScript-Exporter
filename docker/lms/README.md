# LMS test lab

Local Moodle, ILIAS and OpenOlat instances, plus an xAPI learning record store,
for checking exported packages in the real thing rather than against the
manifest only. Every instance runs on its own port, on localhost only, with a
throwaway database.

```sh
docker/lms/lms.sh list                       # targets, ports and logins
docker/lms/lms.sh up moodle405               # start; installs on the first run
docker/lms/lms.sh test moodle405 course.zip  # import, run as a learner, report
docker/lms/lms.sh stored moodle405           # what Moodle saved for those runs
docker/lms/lms.sh down moodle405             # stop and delete everything
```

| Target | Platform | Image |
|---|---|---|
| `moodle311`, `moodle405`, `moodle500` | Moodle 3.11, 4.5 LTS, 5.0 | official [moodle-docker](https://github.com/moodlehq/moodle-docker) with the Moodle source of that branch |
| `ilias9`, `ilias10`, `ilias11` | ILIAS | [srsolutions/ilias](https://hub.docker.com/r/srsolutions/ilias) |
| `openolat` | OpenOlat 19.1 | [frentix/openolat](https://hub.docker.com/r/frentix/openolat) (published "for testing only") |
| `lrs` | xAPI LRS | [yetanalytics/lrsql](https://hub.docker.com/r/yetanalytics/lrsql) |

Needs Docker with the compose plugin, and `npm install` in the repository for
`test` (it uses Playwright). Downloads (Moodle sources, moodle-docker, the
OpenOlat schema) go to `docker/lms/.cache/`.

## What `test` does

`test` imports each package and opens it twice, the way a learner would. It is
made for the fixture course, `tests/fixtures/course/README.md`:

1. The first visit answers the text quiz (`MKQuizText`), then moves to slide 5.
2. The learner leaves and opens the activity again.
3. The second visit checks that the LMS returned to slide 5 and restored the
   quiz answer.

Every call to the LMS's own SCORM API is recorded with its error code, so a
value the LMS rejects shows up as `apiErrors`. `stored` then shows what the LMS
kept in its database: status, score and location.

```sh
liaex -i tests/fixtures/course/README.md -f presets --moodle4 -o /tmp/moodle4
docker/lms/lms.sh test moodle405 /tmp/moodle4.zip
```

## Platform notes

- **Moodle** passes no mastery score to the package when the manifest says `0`.
  An attempt then has to be scored by the package itself.
- **ILIAS** and **OpenOlat** start a SCORM 1.2 package without the manifest's
  launch parameters, so a plain export only shows LiaScript's start page there.
  Use `--scorm-iframe` or `--scorm-embed` (the `ilias` and `openolat` presets
  do).
- **ILIAS** runs a package in "no-credit" mode, discarding status and score,
  unless learning progress is switched on (Administration → Learning Progress).
  `lms.sh up` switches it on.
- **OpenOlat** imports SCORM 1.2 only. Started by its owner from the authoring
  view, a package runs as a preview and keeps no progress; tracking needs the
  package in a published course.
- **OpenOlat** asks for a new password and the terms of use on the first login;
  `test` does both.
