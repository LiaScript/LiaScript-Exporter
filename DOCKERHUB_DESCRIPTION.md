# Docker Hub Description for LiaScript-Exporter

## Short Description (100 character limit)
Export LiaScript courses to SCORM, IMS, PDF, APK, Web, and other formats for LMS platforms like Moodle.

## Full Description

# LiaScript-Exporter

Export educational LiaScript Markdown courses into multiple formats for Learning Management Systems (LMS), static content readers, and mobile platforms.

## Features

- **Multiple Export Formats**: SCORM 1.2, SCORM 2004, IMS Content Package, Web (PWA), PDF, ePub, Android APK, and more
- **LMS Integration**: Compatible with Moodle, ILIAS, OPAL, Blackboard, and other SCORM-compliant platforms
- **Web Interface**: User-friendly web server mode with job queue and multi-user support
- **CLI Tool**: Command-line interface for automated batch processing
- **Git Repository Support**: Export directly from Git repositories with branch/subdirectory options
- **Preset Configurations**: Pre-configured settings for popular LMS platforms

## Usage

### Web Server Mode (Recommended)
```bash
docker run -p 4000:4000 liascript/exporter
```
Access the web interface at `http://localhost:4000`

### CLI Mode
```bash
docker run -v $(pwd):/workspace liascript/exporter \
  liaex -i /workspace/course.md -f scorm1.2 -o /workspace/output
```

## Perfect For

- Educational institutions providing self-service export solutions
- Course creators needing multi-platform distribution
- OER (Open Educational Resources) content creators
- Organizations migrating content between different LMS platforms

## Documentation

Full documentation: [GitHub Repository](https://github.com/liaScript/LiaScript-Exporter)

## Project Support

This project is funded by the German Federal Ministry for Family Affairs, Senior Citizens, Women and Youth (BMBFSFJ) as part of the federal government's OER strategy.

## License

Licensed under MIT
