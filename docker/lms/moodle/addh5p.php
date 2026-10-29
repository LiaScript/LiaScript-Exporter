<?php
// Usage: php addh5p.php <package.h5p> <activity name> <course shortname>
// Prints the course module id of the new H5P activity. Runs inside the
// moodle-docker webserver container, see lms.sh. The package's libraries are
// installed when the admin first opens the activity.
define('CLI_SCRIPT', true);

foreach (['/var/www/html/config.php', '/var/www/html/public/config.php'] as $config) {
    if (file_exists($config)) { require($config); break; }
}

require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/course/modlib.php');
require_once($CFG->libdir . '/filelib.php');
require_once($CFG->libdir . '/enrollib.php');

[$package, $name, $shortname] = array_slice($argv, 1);

$admin = get_admin();
\core\session\manager::set_user($admin);

$course = $DB->get_record('course', ['shortname' => $shortname]);
if (!$course) {
    $course = create_course((object) [
        'fullname' => $shortname, 'shortname' => $shortname, 'category' => 1,
        'enablecompletion' => 1,
    ]);
}

// the learner in the lab is the admin, enrolled as a student, see addscorm.php
enrol_try_internal_enrol($course->id, $admin->id, $DB->get_field('role', 'id', ['shortname' => 'student']));

$draftid = file_get_unused_draft_itemid();
get_file_storage()->create_file_from_pathname([
    'contextid' => context_user::instance($admin->id)->id,
    'component' => 'user', 'filearea' => 'draft', 'itemid' => $draftid,
    'filepath' => '/', 'filename' => basename($package),
], $package);

$mi = (object) [
    'modulename' => 'h5pactivity',
    'module' => $DB->get_field('modules', 'id', ['name' => 'h5pactivity']),
    'name' => $name,
    'course' => $course->id,
    'section' => 0,
    'visible' => 1,
    'introeditor' => ['text' => '', 'format' => FORMAT_HTML, 'itemid' => file_get_unused_draft_itemid()],
    'packagefile' => $draftid,
    'displayoptions' => 0,
    'enabletracking' => 1,
    'grademethod' => 1, // highest attempt
    'reviewmode' => 1,
    'grade' => 100,
    'enablesavestate' => 1,
    'savestatefreq' => 10,
    'cmidnumber' => '', 'groupmode' => 0, 'groupingid' => 0,
];

$mod = add_moduleinfo($mi, $course);
echo $mod->coursemodule, "\n";
