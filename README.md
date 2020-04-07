# LiaScript-Exporter


This shall be a generic LiaScript-Exporter that can export educational content
into different formats, so that LiaScript courses can also be utilized in
different Learning Management Systems (LMS) or Readers for static content (PDF,
ePub, ...). At the moment there is only support for SCORM1.2, as the most
wide-spread exchange format. See the last section [LMS Support List](#LMS-Support-List)

> __But__, it is still the easiest way to share your courses via
> __`https://LiaScript.github.io/course/?YOUR_REPO`__. The LiaScript course
> website is a fully fledged "offline-first" Progressive Web App (PWA), which
> allows to store all of your courses and states directly within your browser. If
> you are comming from Android, you can also directly install the website as an
> app on your device. Actually, there is now need for a BackEnd-system anymore,
> but if you need to track the progress of you students, you can use this tool...


## Install

At the moment this is a simple command-line tool based on NodeJS, thus you will
have to install NodeJS first, which contains also `npm` the Node Package
Manager. You can directly download the installer for your system from:

https://nodejs.org/en/download/

Afterwards you can open your terminal and type in the following command, this
will install the LiaScript-Exporter as a global application on your system.

``` bash
$ npm install -g --verbose https://github.com/liaScript/LiaScript-Exporter
```

Depending on your configuration, you might need to run this command with root
privileges. In my case on Linux it is simply:

``` bash
$ sudo npm install -g --verbose https://github.com/liaScript/LiaScript-Exporter
```

On Windows you might need to run the terminal with administrator-privileges.


## Basic usage

If you have installed the package, you can now use `liaex` or
`liascript-exporter`. If you type one of the following commands, you will get
the following output.

``` shell
$ liaex
No input defined
LiaScript-Exporter

-h --help            show this help
-i --input           file to be used as input
-p --path            path to be packed, if not set, the path of the input file is used
-o --output          output file name (default is output), the ending is define by the format
-f --format          scorm1.2, json, fullJson, web (default is json)

-k --key             responsive voice key

SCORM 1.2 settings:

--organization          set the organization title
--masteryScore          set the scorm masteryScore (a value between 0 -- 100), default is 80
```


### SCORM1.2


If you want to generate a SCORM1.2 conformant package of you LiaScript-course,
use the following command:

``` shell
$ liaex -i project/README.md --format scorm1.2 --output rockOn

[17:8:33] SCORM 'Init'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/imsmanifest.xml'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/metadata.xml'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/adlcp_rootv1p2.xsd'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/ims_xml.xsd'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/imscp_rootv1p1p2.xsd'
[17:8:33] SCORM 'create /tmp/lia202037-30349-o6yx80.zb0eo/pro/imsmd_rootv1p2p1.xsd'
[17:8:33] SCORM 'Archiving /tmp/lia202037-30349-o6yx80.zb0eo/pro to rockOn_v1.0.0_2020-04-07.zip'
[17:8:34] SCORM 'rockOn_v1.0.0_2020-04-07.zip 4977779 total bytes'
Done

$ ls
.. rockOn_v1.0.0_2020-04-07.zip ..
```

The format is `scorm1.2` and the input folder is `project/README.md`. All the
content and sub-folders of this folder is then coppied into your SCORM.zip. The
name is defined by your output definition and contains the current version
number of you course as well as the current date.

__Text 2 Speech `--key`__

If you want to use text2speech, you will have to register your website (where
the scorm package will be served) at https://responsivevoice.org/ ... it is free
for educational and non commercial purposes. After your registration, you will
get a key in the format of `KluQksUs`. To inject this key into your package,
simly add the key as a paramter:

``` shell
$ liaex -i project/README.md --format scorm1.2 --key KluQksUs --output rockOn
...
```

__Mastery Score `--masteryScore`__

You can define the percentage of quizzes and surveys a student had to fullfill
in order to accomplish or pass the course by adding the `--masteryScore`
parameter. Just set it to 0 to allow all to pass the course, otherwise choose a
value between 0 and 100. All quizzes and surveys are treated equally, thus if
your course contains 10 quizzes, every quiz counts as 10%. If you do not set
this paramter, a default value of 80 percent is used.

``` shell
$ liaex -i project/README.md --format scorm1.2 --masteryScore 0 --output rockOn
...
```

__Other Root `--path`__

If your README is not in the root of your project, you can also use the `--path`
paramter to the directory to be coppied into your scorm project. You will still
have to use `--input` to define the main course document, but his has to be
relative to path paramter.

__`--organization`__

This paramter simply sets the organization paramter in your SCORM imsmanifest file. All other parameters are taken from the course

## TODOs & Contributions

* Further exporter

  - SCORM 2004
  - AICC
  - xAPI
  - IMS Cartridge
  - PDF
  - ePub

* Integration into the Atom IDE

* GitHub actions to automate building during push ...


### Custom extensions

If you are interested in creating integrations for other systems by your own,
you can do this, by defining custom connectors for your target system. They are
located at
[src/javascript/connectors](https://github.com/liaScript/LiaScript/tree/master/src/javascript/connectors).
Actually it is a simple class that inherits all methods from `Base/Connector`,
which have to be changed in accordance to you system.
__I will have to document this__


## LMS Support List


Most of the data is taken from:

* https://www.ispringsolutions.com/supported-lms
* https://en.wikipedia.org/wiki/List_of_learning_management_systems


| LMS                                | SCORM 1.2 | SCORM 2004 | xAPI    | AICC    | CMI-5 | IMS | License     |
| ---------------------------------- | --------- | ---------- | ------- | ------- | ----- | --- | ----------- |
| Abara LMS                          | full      | full       |         |         |       |     |             |
| Absorb LMS                         | full      | full       | full    | full    |       |     |             |
| Academy LMS                        | full      | full       |         |         |       |     |             |
| Academy Of Mine                    | full      | full       | full    |         |       |     |             |
| Accessplanit LMS                   | full      | full       |         |         |       |     |             |
| Accord LMS                         | full      | full       |         |         |       |     |             |
| Activate LMS                       |           | full       |         |         |       |     |             |
| Administrate LMS                   | full      | full       |         |         |       |     |             |
| Adobe Captivate Prime LMS          | full      |            |         |         |       |     |             |
| Agylia LMS                         | full      |            | full    |         |       |     |             |
| Alchemy LMS                        |           | full       |         |         |       |     |             |
| Alumn-e LMS                        | full      |            |         |         |       |     |             |
| aNewSpring LMS                     | full      |            |         |         |       |     |             |
| Asentia LMS                        | full      | full       | full    |         |       |     |             |
| aTutor                             | full      |            |         |         |       |     | open source |
| Axis LMS                           | partial   |            |         |         |       |     |             |
| BIStrainer LMS                     | full      | full       |         |         |       |     |             |
| BizLibrary LMS                     | full      |            |         |         |       |     |             |
| Blackboard LMS                     | full      | full       | partial | full    |       |     |             |
| BlueVolt LMS                       | full      | full       |         | full    |       |     |             |
| BrainCert LMS                      | full      | full       |         |         |       |     |             |
| Bridge LMS                         | full      | full       |         | full    |       |     |             |
| Brightspace LMS                    | full      | full       |         |         |       |     |             |
| Business Training TV (by Vocam)    | full      | full       | full    |         |       |     |             |
| Buzz LMS (by Agilix)               | full      | full       |         | partial |       |     |             |
| Canvas LMS                         | full      | full       |         |         |       |     | open source |
| CERTPOINT Systems Inc.             | full      | full       |         |         |       |     | proprietary |
| Chamilo LMS                        | full      |            |         |         |       |     | open source |
| Claroline                          | full      |            |         |         |       |     | open source |
| Claromentis LMS                    | full      |            |         |         |       |     |             |
| chocolateLMS                       | full      |            |         |         |       |     |             |
| Coggno LMS                         | full      | full       |         |         |       |     |             |
| Cognology LMS                      | full      |            |         |         |       |     |             |
| Collaborator LMS                   | full      | full       |         |         |       |     |             |
| ComplianceWire LMS                 | full      | full       |         |         |       |     |             |
| Cornerstone LMS                    | partial   | full       |         |         |       |     |             |
| CourseMill LMS                     | full      | full       |         |         |       |     |             |
| CoursePark LMS                     | full      | full       |         |         |       |     |             |
| Coursepath LMS                     | full      | full       | full    |         |       |     |             |
| Courseplay LMS                     | full      | full       |         |         |       |     |             |
| CourseSites LMS                    | full      | full       |         |         |       |     |             |
| CrossKnowledge Learning Suite      | full      | full       |         | full    |       |     |             |
| Curatr LMS                         | partial   | partial    | full    |         |       |     |             |
| DigitalChalk LMS                   | full      | no         | full    |         |       |     |             |
| Desire2Learn                       |           | full       |         |         | full  |     | proprietary |
| Docebo LMS                         | full      | full       |         | full    |       |     |             |
| EasyCampus LMS                     | full      |            |         |         |       |     |             |
| eCollege                           |           |            |         |         |       |     | proprietary |
| Edmodo                             |           |            |         |         |       |     | proprietary |
| EduBrite LMS                       | full      | full       |         | full    |       |     |             |
| EducationFolder LMS                |           |            | full    |         |       |     |             |
| EduNxt                             | full      | full       |         |         |       |     | proprietary |
| Eduson LMS                         | partial   |            |         |         |       |     |             |
| Edvance360 LMS                     | full      |            |         |         |       |     |             |
| Effectus LMS                       | full      | full       | full    |         |       |     |             |
| eFront LMS                         | full      |            |         |         |       |     | open source |
| eLeap LMS                          | full      |            |         |         |       |     |             |
| ELMO                               | full      |            |         |         |       |     |             |
| Elsevier Performance Manager LMS   | full      |            |         |         |       |     |             |
| Emtrain LMS                        | full      | full       |         | full    |       |     |             |
| Engrade                            |           |            |         |         |       |     | proprietary |
| eSSential LMS                      | full      |            | full    |         |       |     |             |
| eTraining TV (by Vocam)            | full      | full       | full    |         |       |     |             |
| Evolve LMS                         | full      |            |         |         |       |     |             |
| Exceed LMS                         | full      |            |         |         |       |     |             |
| ExpertusONE LMS                    | full      | full       |         |         |       |     |             |
| EZ LCMS                            | full      | full       |         |         |       |     |             |
| Firmwater LMS                      | full      | full       |         |         |       |     |             |
| Flora                              | full      | full       |         |         |       |     |             |
| Forma LMS                          | full      | full       |         |         |       |     |             |
| Geenio LMS                         | partial   | partial    |         |         |       |     |             |
| GlobalScholar                      |           |            |         |         |       |     | proprietary |
| Glow                               |           |            |         |         |       |     | proprietary |
| GnosisConnect LMS                  | full      | full       |         |         |       |     |             |
| Google Classroom                   | no        | no         | no      |         |       |     |             |
| GoSkills LMS                       | full      | full       | full    |         |       |     |             |
| GO1 LMS                            | full      | full       |         |         |       |     |             |
| GrassBlade LRS                     | full      | full       | full    |         |       |     |             |
| Grovo LMS                          | full      | full       | full    |         |       |     |             |
| GyrusAim LMS                       | full      | full       | full    | full    |       |     |             |
| HealthStream LMS                   | full      | full       |         |         |       |     |             |
| HotChalk                           |           |            |         |         |       |     | proprietary |
| ILIAS LMS                          | full      | full       |         |         |       |     |             |
| iLMS                               | full      | full       |         | full    |       |     | open source |
| IMC Learning Suite                 |           | full       |         |         |       |     |             |
| Informetica LMS                    | full      | full       |         |         |       |     |             |
| Inquisiq R4 LMS                    | full      | full       |         |         |       |     |             |
| Intuition Rubicon LMS              | full      |            |         |         |       |     |             |
| In2itive LMS                       | full      | full       |         |         |       |     |             |
| ISOtrain LMS                       | full      | full       |         | full    |       |     |             |
| iSpring Learn                      | full      | full       |         |         |       |     |             |
| JLMS                               | full      | full       | full    | full    |       |     |             |
| JoomlaLMS                          | full      | full       |         |         |       |     |             |
| Kannu                              |           |            |         |         |       |     | proprietary |
| KMI LMS                            | full      |            | full    |         |       |     |             |
| LabVine LMS by LTS Health Learning | full      |            |         |         |       |     |             |
| LAMS                               | partial   |            |         |         |       |     | open source |
| LatitudeLearning LMS               | full      | full       |         |         |       |     |             |
| LearnConnect LMS                   | full      |            |         |         |       |     |             |
| LearnDash LMS                      | no        | no         | no      | full    |       |     |             |
| LearningCart LMS                   | full      | full       |         |         |       |     |             |
| learningCentral LMS                | full      | full       | full    | full    |       |     |             |
| LearningZen LMS                    | full      | full       | full    |         |       |     |             |
| Learning Locker LRS                |           |            | full    |         |       |     |             |
| learnPro LCMS                      | full      |            |         |         |       |     |             |
| LearnUpon LMS                      | full      |            | full    |         |       |     |             |
| LearnWorlds LMS                    | full      | full       |         |         |       |     |             |
| Learn-WiseGo LMS                   |           | full       |         |         |       |     |             |
| LifterLMS                          |           |            | full    |         |       |     |             |
| Litmos LMS                         | full      |            | full    |         |       |     |             |
| LMS365                             | full      | full       |         |         |       |     |             |
| LON-CAPA                           | partial   |            |         |         |       |     | open source |
| MATRIX LMS                         | full      |            |         |         |       |     |             |
| Meridian LMS                       | full      | full       |         |         |       |     |             |
| Mobile Agility LMS                 | full      | full       |         |         |       |     |             |
| Moodle LMS                         | full      | full       |         | partial |       |     |             |
| MOS Chorus LMS                     |           | full       |         |         |       |     |             |
| Myicourse LMS                      | partial   | partial    |         |         |       |     |             |
| MySkillpad LMS                     | full      | full       |         |         |       |     |             |
| NEO LMS                            | full      |            |         |         |       |     |             |
| NetDimensions Learning             | full      | full       |         | full    |       |     |             |
| Nimble LMS                         | full      |            |         |         |       |     |             |
| Ninth Brain LMS                    | full      | full       | full    |         |       |     |             |
| OLAT LMS                           | full      | full       |         |         |       |     |             |
| OPAL                               | full      | no         |         |         |       |     |             |
| Open edx                           | full      |            |         |         |       |     | open source |
| OpenOLAT                           | full      |            |         |         |       |     | open source |
| Opigno LMS                         | full      | full       |         |         |       |     |             |
| Oracle Taleo Learn Cloud Service   | full      | full       |         | full    |       |     |             |
| Paradiso LMS                       | full      | full       |         |         |       |     |             |
| Percepium LMS                      | full      | full       |         |         |       |     |             |
| Percolate LMS                      | full      | full       |         |         |       |     |             |
| Prosperity LMS                     | full      | full       |         |         |       |     |             |
| RISC's Virtual Training Assistant  | full      | full       | full    | full    | full  |     |             |
| Saba LMS                           | full      | full       |         | full    |       |     |             |
| Sakai LMS                          | full      | full       |         |         |       |     |             |
| SAP SuccessFactors LMS             | full      | full       |         | full    |       |     | proprietary |
| ScholarLMS                         | full      | full       | full    |         |       |     |             |
| Schoology LMS                      | full      | full       |         |         |       |     | proprietary |
| Schoox LMS                         | full      | full       |         |         |       |     |             |
| ShareKnowledge LMS                 | full      | full       |         |         |       |     |             |
| Shika LMS                          | full      | full       |         |         |       |     |             |
| SilkRoad LMS                       | full      | full       |         | full    |       |     |             |
| Simplify LMS                       | full      |            | full    |         |       |     |             |
| Skilljar LMS                       | full      |            |         |         |       |     |             |
| Skillsoft                          |           |            |         |         |       |     | proprietary |
| SkillsServe LMS                    | full      | full       |         |         |       |     |             |
| SmarterU LMS                       | full      | full       |         | full    |       |     |             |
| Spongelab                          |           |            |         |         |       |     | proprietary |
| SuccessFactors                     |           |            |         |         |       |     | proprietary |
| SumTotal LMS (by SkillSoft)        | full      | full       |         | full    |       |     | proprietary |
| SWAD                               |           |            |         |         |       |     | open source |
| SwiftLMS                           | full      | full       |         |         |       |     |             |
| Syberworks LMS                     |           |            |         |         |       |     |             |
| Syfadis Suite LMS                  | full      | full       |         |         |       |     |             |
| Thinking Cap LMS                   | full      | full       |         |         |       |     |             |
| TalentLMS                          | full      | no         | full    |         |       |     |             |
| Taleo                              | full      | full       |         | partial |       |     | proprietary |
| TCManager LMS                      | full      |            |         |         |       |     |             |
| Techniworks LMS                    | full      | full       |         |         |       |     |             |
| Thinkific LMS                      |           |            |         |         |       |     |             |
| TOPYX LMS                          | full      | full       |         |         |       |     |             |
| Torch LMS                          | full      | full       | full    | full    |       |     |             |
| Totara LMS                         | full      |            |         |         |       |     |             |
| Udutu LMS                          | full      | full       |         |         |       |     |             |
| UpGraduate LMS                     | full      | full       | full    | full    |       |     |             |
| UpsideLMS                          | full      | full       | partial |         |       |     |             |
| Uzity                              |           |            |         |         |       |     | proprietary |
| ViewCentral LMS                    | full      |            |         |         |       |     |             |
| viLMS                              | full      | full       |         |         |       |     |             |
| Vowel LMS                          | full      | full       |         |         |       |     |             |
| Watershed LRS                      |           |            | full    |         |       |     |             |
| Wax LRS                            |           |            | full    |         |       |     |             |
| WBTServer LMS                      |           | full       |         |         |       |     |             |
| WebCampus LMS                      | full      |            |         |         |       |     |             |
| WeBWorK                            |           |            |         |         |       |     | open source |
| WestNet MLP                        | partial   | partial    | partial |         |       |     |             |
| wizBank e-Learning Platform        | full      | full       |         |         |       |     |             |
| WizIQ LMS                          | partial   | partial    |         |         |       |     |             |
| Workday LMS                        | full      | full       |         |         |       |     |             |
| WorkWize LMS                       | full      |            |         |         |       |     |             |
| xapiapps LMS                       | full      | full       | full    |         |       |     |             |
| 360Learning LMS                    | full      | full       |         |         |       |     |             |
