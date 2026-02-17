# SQLite Viewer

A modern, cross-platform SQLite database viewer built with [Wails](https://wails.io) (Go + React) and [Ant Design](https://ant.design). Browse tables, execute queries, and edit data with a clean, intuitive interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Go](https://img.shields.io/badge/Go-1.20+-00ADD8.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)

![Screenshot](screenshot.png)

## Features

- **Browse Tables**: Quickly view all tables in your SQLite database
- **Schema View**: Inspect column names, types, and constraints
- **Data Editor**: View, insert, update, and delete rows with ease
- **Query Editor**: Execute custom SQL queries with a clean interface
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Modern UI**: Clean interface with responsive design

## Installation

### Prerequisites

- [Go](https://golang.org/dl/) 1.20 or later
- [Node.js](https://nodejs.org/) 18 or later
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

### Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/sqlite-viewer.git
cd sqlite-viewer

# Install frontend dependencies
cd frontend
npm install
cd ..

# Run in development mode
wails dev

# Build for production
wails build
```

## Usage

1. Launch the application
2. Click **"Open Database"** to select an SQLite file
3. Select a table from the sidebar to view its schema and data
4. Use the tabs to switch between:
   - **Table Schema**: View column definitions
   - **Data**: Browse and edit rows
   - **Query Editor**: Run custom SQL queries

### Data Editing

- **Insert**: Click "Insert Row" to add new records
- **Edit**: Click the edit icon on any row to modify
- **Delete**: Click the delete icon to remove a row

## Development

This project uses:

- **Backend**: Go with [go-sqlite3](https://github.com/mattn/go-sqlite3) driver
- **Frontend**: React with Ant Design components
- **Framework**: Wails v2 for native app packaging

### Project Structure

```
.
├── app.go              # Go backend with SQLite operations
├── main.go             # Wails app entry point
├── wails.json          # Wails configuration
└── frontend/           # React frontend
    ├── src/
    │   ├── App.jsx     # Main application component
    │   └── App.css     # Styles
    └── package.json
```

### Live Development

Run `wails dev` to start the development server with hot reload.

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

Please ensure your code follows the existing style and includes appropriate tests.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Wails](https://wails.io)
- UI components by [Ant Design](https://ant.design)
- SQLite driver by [go-sqlite3](https://github.com/mattn/go-sqlite3)
