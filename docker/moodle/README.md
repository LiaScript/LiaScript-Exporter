# Moodle settings

Source: https://hub.docker.com/r/bitnami/moodle/

run: `docker-compose up`

Starts at: http://127.0.0.1:8080

- `MOODLE_USERNAME`: Moodle application username.

  Default: user

- `MOODLE_PASSWORD`: Moodle application password.

  Default: bitnami

- `MOODLE_EMAIL`: Moodle application email.

  Default: user@example.com

- `MOODLE_SITE_NAME`: Moodle site name.

  Default: New Site

- `MOODLE_SITE_NAME`: Moodle www root.
  
  No defaults.

- `MOODLE_SKIP_BOOTSTRAP`: Do not initialize the Moodle database for a new
  deployment. This is necessary in case you use a database that already has
  Moodle data.
  
  Default: no
