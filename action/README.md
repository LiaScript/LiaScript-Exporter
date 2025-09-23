# LiaScript Exporter GitHub Action

Export LiaScript courses to SCORM, PDF, Web, and other formats for LMS deployment and distribution directly from your GitHub repository.

## Quick Start

Add this action to your workflow:

```yaml
- name: Export course to SCORM
  id: export
  uses: grugnog/LiaScript-Exporter@github-actions
  with:
    input-file: 'README.md'
    format: 'scorm1.2'
    output-name: 'my-course'
```

## Inputs

### Core Inputs (Required)

| Input | Description | Example |
|-------|-------------|---------|
| `input-file` | Path to README.md or project.yml file | `course1/README.md` |
| `format` | Export format | `scorm1.2`, `pdf`, `web`, `ims`, `xapi`, `rdf`, `json` |

### Core Inputs (Optional)

| Input | Description | Default |
|-------|-------------|---------|
| `output-name` | Base name for output files | Derived from input file |
| `course-path` | Directory containing the course | Directory of input-file |

### SCORM Settings

| Input | Description | Default |
|-------|-------------|---------|
| `scorm-organization` | Organization title | - |
| `scorm-mastery-score` | Mastery score (0-100) | `0` |
| `scorm-typical-duration` | Duration (PT0H5M0S format) | `PT0H5M0S` |
| `scorm-iframe` | Use iframe for SCORM | `false` |
| `scorm-embed` | Embed Markdown in JS | `false` |
| `scorm-always-active` | Keep SCORM always active | `false` |

### PDF Settings

| Input | Description | Default |
|-------|-------------|---------|
| `pdf-theme` | LiaScript theme | `default` |
| `pdf-format` | Paper format | `A4` |
| `pdf-scale` | Webpage rendering scale | `1` |
| `pdf-landscape` | Landscape orientation | `false` |
| `pdf-print-background` | Print background graphics | `false` |
| `pdf-stylesheet` | Custom CSS file path | - |

### Web Settings

| Input | Description | Default |
|-------|-------------|---------|
| `web-zip` | Create zip archive | `true` |
| `web-indexeddb` | Enable IndexedDB storage | `false` |
| `web-iframe` | Use iframe version | `false` |

### IMS Settings

| Input | Description | Default |
|-------|-------------|---------|
| `ims-indexeddb` | Use IndexedDB for persistence | `false` |

### xAPI Settings

| Input | Description | Default |
|-------|-------------|---------|
| `xapi-endpoint` | LRS endpoint URL | - |
| `xapi-auth` | Authentication string | - |
| `xapi-actor` | xAPI actor JSON | - |
| `xapi-course-id` | Course identifier | - |
| `xapi-course-title` | Course title | - |
| `xapi-debug` | Enable debug logging | `false` |
| `xapi-zip` | Package as zip | `false` |

### RDF Settings

| Input | Description | Default |
|-------|-------------|---------|
| `rdf-format` | Output format (json-ld, n-quads) | `json-ld` |
| `rdf-url` | External URL reference | - |
| `rdf-type` | Schema.org type | `Course` |
| `rdf-license` | License URL | - |
| `rdf-educational-level` | Educational level | - |

### General Settings

| Input | Description | Default |
|-------|-------------|---------|
| `style` | Additional CSS styling | - |
| `responsive-voice-key` | Text-to-speech API key | - |

## Outputs

| Output | Description |
|--------|-------------|
| `output-file` | Path to the generated file |
| `file-size` | Size of generated file in bytes |
| `format` | Format that was generated |
| `success` | Whether export succeeded (true/false) |

## Usage Examples

### Single Course Export

```yaml
name: Export Course
on: [push]

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Export to SCORM
      id: export
      uses: LiaScript/LiaScript-Exporter@master
      with:
        input-file: 'README.md'
        format: 'scorm1.2'
        output-name: 'my-course'
        scorm-organization: 'My Organization'
        scorm-mastery-score: '80'
    
    - name: Upload SCORM package
      uses: actions/upload-artifact@v4
      with:
        name: scorm-package
        path: ${{ steps.export.outputs.output-file }}
```

### Multi-Course Matrix Build

```yaml
name: Export All Courses
on: [push]

jobs:
  export:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        course: ['course1', 'course2', 'course3']
        format: ['scorm1.2', 'pdf', 'web']
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Export ${{ matrix.course }} to ${{ matrix.format }}
      id: export
      uses: LiaScript/LiaScript-Exporter@master
      with:
        input-file: '${{ matrix.course }}/README.md'
        format: '${{ matrix.format }}'
        output-name: '${{ matrix.course }}-${{ matrix.format }}'
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v4
      with:
        name: ${{ matrix.course }}-${{ matrix.format }}
        path: ${{ steps.export.outputs.output-file }}
```

### Release Automation

```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Export to SCORM
      id: export-scorm
      uses: LiaScript/LiaScript-Exporter@master
      with:
        input-file: 'README.md'
        format: 'scorm1.2'
        output-name: 'course-${{ github.ref_name }}'
    
    - name: Export to PDF
      id: export-pdf
      uses: LiaScript/LiaScript-Exporter@master
      with:
        input-file: 'README.md'
        format: 'pdf'
        output-name: 'course-${{ github.ref_name }}'
    
    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        files: |
          ${{ steps.export-scorm.outputs.output-file }}
          ${{ steps.export-pdf.outputs.output-file }}
```

## Development

### Setup

```bash
cd action
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm run test
```

## Troubleshooting

### Common Issues

**PDF export hangs or fails**
- PDF exports use Puppeteer (headless Chrome) which requires sufficient memory and may take several minutes for complex courses
- Ensure the course content renders properly in a regular browser first

**Output file not found**
- Check that the `output-name` parameter matches the expected file pattern
- Verify the input file path is correct relative to the repository root
- Review the action logs for detailed file search information

### Debug Information

The action provides detailed logging including:
- Input validation and parsing
- File path resolution
- CLI command construction
- Real-time export progress
- Output file detection

Enable debug logging in your workflow:

```yaml
- name: Export with debug
  uses: LiaScript/LiaScript-Exporter@master
  with:
    input-file: 'README.md'
    format: 'scorm1.2'
  env:
    ACTIONS_STEP_DEBUG: true
```