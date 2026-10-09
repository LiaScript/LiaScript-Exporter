<?php
// Usage: php addscorm.php <package.zip> <activity name> <course shortname>
// Prints the course module id of the new SCORM activity. Runs inside the
// moodle-docker webserver container, see lms.sh.
define('CLI_SCRIPT', true);

foreach (['/var/www/html/config.php', '/var/www/html/public/config.php'] as $config) {
    if (file_exists($config)) { require($config); break; }
}

require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/course/modlib.php');
require_once($CFG->dirroot . '/mod/scorm/lib.php');
require_once($CFG->dirroot . '/mod/scorm/locallib.php');
require_once($CFG->libdir . '/filelib.php');

[$zip, $name, $shortname] = array_slice($argv, 1);

$admin = get_admin();
\core\session\manager::set_user($admin);

$course = $DB->get_record('course', ['shortname' => $shortname]);
if (!$course) {
    $course = create_course((object) [
        'fullname' => $shortname, 'shortname' => $shortname, 'category' => 1,
        'enablecompletion' => 1,
    ]);
}

$draftid = file_get_unused_draft_itemid();
get_file_storage()->create_file_from_pathname([
    'contextid' => context_user::instance($admin->id)->id,
    'component' => 'user', 'filearea' => 'draft', 'itemid' => $draftid,
    'filepath' => '/', 'filename' => basename($zip),
], $zip);

$cfg = get_config('scorm');
$mi = (object) [
    'modulename' => 'scorm',
    'module' => $DB->get_field('modules', 'id', ['name' => 'scorm']),
    'name' => $name,
    'course' => $course->id,
    'section' => 0,
    'visible' => 1,
    'introeditor' => ['text' => '', 'format' => FORMAT_HTML, 'itemid' => file_get_unused_draft_itemid()],
    'scormtype' => SCORM_TYPE_LOCAL,
    'packagefile' => $draftid,
    'updatefreq' => SCORM_UPDATE_NEVER,
    'popup' => 0, // current window, as most teachers leave it
    'width' => 100, 'height' => 600,
    'skipview' => 0, 'hidebrowse' => 0, 'displaycoursestructure' => 0, 'hidetoc' => 0,
    'nav' => 1, 'navpositionleft' => -100, 'navpositiontop' => -100,
    'displayattemptstatus' => 1, 'auto' => 0, 'autocommit' => 0,
    'maxgrade' => 100, 'grademethod' => GRADEHIGHEST, 'maxattempt' => 0, 'whatgrade' => 0,
    'forcecompleted' => 0, 'forcenewattempt' => 0, 'lastattemptlock' => 0,
    'masteryoverride' => 1, 'timeopen' => 0, 'timeclose' => 0,
    'completionstatusrequired' => null, 'completionscorerequired' => null,
    'completionstatusallscos' => 0,
    'cmidnumber' => '', 'groupmode' => 0, 'groupingid' => 0,
];

$mod = add_moduleinfo($mi, $course);
echo $mod->coursemodule, "\n";
