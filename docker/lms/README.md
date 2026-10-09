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

1. The first visit answers the text quiz (`MKQuizText`), the single-choice
   quiz and the textarea survey, whose answer has line breaks, quotes and a
   leading `{` (values strict LMS refuse unless the package cleans them up).
   Then it moves to slide 5.
2. The learner leaves and opens the activity again.
3. The second visit checks that the LMS returned to slide 5 and restored the
   quiz answer and the survey.

Every call to the LMS's own SCORM API is recorded with its error code, so a
value the LMS rejects shows up as `apiErrors`; `responses` lists the answers
the package reported as interactions, `suspendData` the size of what it kept.
`stored` then shows what the LMS kept in its database: status, score,
location, interactions and the size of `suspend_data`.

```sh
# the suspend connectors: all state in suspend_data, readable interactions
liaex -i tests/fixtures/course/README.md -f scorm1.2 --scorm-storage suspend --scorm-embed -o /tmp/s12
docker/lms/lms.sh test moodle405 /tmp/s12.zip
```

```sh
liaex -i tests/fixtures/course/README.md -f presets --moodle4 -o /tmp/moodle4
docker/lms/lms.sh test moodle405 /tmp/moodle4.zip
```

## Platform notes

- **Moodle** passes no mastery score to the package when the manifest says `0`.
  An attempt then has to be scored by the package itself. With a mastery
  score, SCORM 1.2 activities replace the status by `passed`/`failed` from
  the score when the learner leaves ("Mastery score overrides status"), and
  an attempt that is `passed`, `failed` or `completed` (2004: `completed`)
  opens in review mode afterwards, where nothing is saved.
- **Moodle** reports list enrolled students only, so `test` enrols the admin,
  the lab's learner, as a student of the test course.
- **ILIAS** (SCORM 2004) writes its interactions anew on every save, and the
  stored correct responses keep pointing at the old rows.
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
