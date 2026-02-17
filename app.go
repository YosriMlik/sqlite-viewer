package main

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	_ "github.com/mattn/go-sqlite3"
)

// Column represents a column in a table
type Column struct {
	Name         string
	Type         string
	NotNull      bool
	DefaultValue string
	PrimaryKey   bool
}

// QueryResult represents the result of a SELECT query
type QueryResult struct {
	Columns []string
	Rows    [][]string
}

// App struct
type App struct {
	ctx    context.Context
	db     *sql.DB
	dbPath string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// OpenDatabase opens an SQLite database file
func (a *App) OpenDatabase() (string, error) {
	if a.db != nil {
		a.db.Close()
	}

	dialogOptions := runtime.OpenDialogOptions{
		Title: "Select SQLite Database",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "SQLite Database",
				Pattern:     "*.db",
			},
			{
				DisplayName: "SQLite Database",
				Pattern:     "*.sqlite",
			},
			{
				DisplayName: "SQLite Database",
				Pattern:     "*.sqlite3",
			},
			{
				DisplayName: "All Files",
				Pattern:     "*.*",
			},
		},
	}

	path, err := runtime.OpenFileDialog(a.ctx, dialogOptions)
	if err != nil {
		return "", fmt.Errorf("failed to open file dialog: %v", err)
	}

	if path == "" {
		return "", fmt.Errorf("no file selected")
	}

	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return "", fmt.Errorf("failed to open database: %v", err)
	}

	if err := db.Ping(); err != nil {
		return "", fmt.Errorf("failed to connect to database: %v", err)
	}

	a.db = db
	a.dbPath = path
	return path, nil
}

// GetTables returns a list of all tables in the database
func (a *App) GetTables() ([]string, error) {
	if a.db == nil {
		return nil, fmt.Errorf("no database open")
	}

	rows, err := a.db.Query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("failed to query tables: %v", err)
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, fmt.Errorf("failed to scan table name: %v", err)
		}
		tables = append(tables, name)
	}

	return tables, nil
}

// GetTableSchema returns the schema for a given table
func (a *App) GetTableSchema(tableName string) ([]Column, error) {
	if a.db == nil {
		return nil, fmt.Errorf("no database open")
	}

	query := fmt.Sprintf("PRAGMA table_info(%s)", tableName)
	
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query table schema: %v", err)
	}
	defer rows.Close()

	var columns []Column
	for rows.Next() {
		var col Column
		var cid int
		var pk int
		var dfltValue sql.NullString
		
		if err := rows.Scan(&cid, &col.Name, &col.Type, &col.NotNull, &dfltValue, &pk); err != nil {
			return nil, fmt.Errorf("failed to scan column info: %v", err)
		}
		
		col.PrimaryKey = pk > 0
		if dfltValue.Valid {
			col.DefaultValue = dfltValue.String
		}
		
		columns = append(columns, col)
	}

	return columns, nil
}

// ExecuteQuery executes a SELECT query and returns the results
func (a *App) ExecuteQuery(query string) (*QueryResult, error) {
	if a.db == nil {
		return nil, fmt.Errorf("no database open")
	}

	if !strings.HasPrefix(strings.TrimSpace(strings.ToUpper(query)), "SELECT") {
		return nil, fmt.Errorf("only SELECT queries are supported")
	}

	rows, err := a.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %v", err)
	}

	result := &QueryResult{
		Columns: columns,
		Rows:    [][]string{},
	}

	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range columns {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, fmt.Errorf("failed to scan row: %v", err)
		}

		row := make([]string, len(columns))
		for i, val := range values {
			if val == nil {
				row[i] = "NULL"
			} else {
				row[i] = fmt.Sprintf("%v", val)
			}
		}
		result.Rows = append(result.Rows, row)
	}

	return result, nil
}

// CloseDatabase closes the current database connection
func (a *App) CloseDatabase() error {
	if a.db == nil {
		return nil
	}
	
	err := a.db.Close()
	a.db = nil
	a.dbPath = ""
	return err
}

// GetDatabasePath returns the current database path
func (a *App) GetDatabasePath() string {
	return a.dbPath
}

// GetTableData returns all data from a table
func (a *App) GetTableData(tableName string) (*QueryResult, error) {
	if a.db == nil {
		return nil, fmt.Errorf("no database open")
	}

	query := fmt.Sprintf("SELECT * FROM %s", tableName)
	
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query table data: %v", err)
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("failed to get columns: %v", err)
	}

	result := &QueryResult{
		Columns: columns,
		Rows:    [][]string{},
	}

	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range columns {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, fmt.Errorf("failed to scan row: %v", err)
		}

		row := make([]string, len(columns))
		for i, val := range values {
			if val == nil {
				row[i] = "NULL"
			} else {
				row[i] = fmt.Sprintf("%v", val)
			}
		}
		result.Rows = append(result.Rows, row)
	}

	return result, nil
}

// InsertRow inserts a new row into a table
func (a *App) InsertRow(tableName string, values []string) error {
	if a.db == nil {
		return fmt.Errorf("no database open")
	}

	placeholders := make([]string, len(values))
	for i := range placeholders {
		placeholders[i] = "?"
	}

	query := fmt.Sprintf("INSERT INTO %s VALUES (%s)", tableName, strings.Join(placeholders, ","))
	
	stmt, err := a.db.Prepare(query)
	if err != nil {
		return fmt.Errorf("failed to prepare insert statement: %v", err)
	}
	defer stmt.Close()

	args := make([]interface{}, len(values))
	for i, v := range values {
		args[i] = v
	}

	_, err = stmt.Exec(args...)
	if err != nil {
		return fmt.Errorf("failed to insert row: %v", err)
	}

	return nil
}

// UpdateRow updates a row in a table
func (a *App) UpdateRow(tableName string, column string, value string, whereColumn string, whereValue string) error {
	if a.db == nil {
		return fmt.Errorf("no database open")
	}

	query := fmt.Sprintf("UPDATE %s SET %s = ? WHERE %s = ?", tableName, column, whereColumn)
	
	_, err := a.db.Exec(query, value, whereValue)
	if err != nil {
		return fmt.Errorf("failed to update row: %v", err)
	}

	return nil
}

// DeleteRow deletes a row from a table
func (a *App) DeleteRow(tableName string, whereColumn string, whereValue string) error {
	if a.db == nil {
		return fmt.Errorf("no database open")
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE %s = ?", tableName, whereColumn)
	
	_, err := a.db.Exec(query, whereValue)
	if err != nil {
		return fmt.Errorf("failed to delete row: %v", err)
	}

	return nil
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// ReloadWindow reloads the webview
func (a *App) ReloadWindow() {
	runtime.WindowReload(a.ctx)
}
