import { useState } from 'react';
import { Layout, Menu, Button, Table, Input, Card, message, Empty, Spin, Typography, Tabs, Space, Modal, Form, Popconfirm } from 'antd';
import { DatabaseOutlined, TableOutlined, FileSearchOutlined, PlayCircleOutlined, FolderOpenOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import './App.css';
import { OpenDatabase, GetTables, GetTableSchema, ExecuteQuery, CloseDatabase, GetDatabasePath, GetTableData, InsertRow, UpdateRow, DeleteRow, ReloadWindow } from '../wailsjs/go/main/App';

const { Header, Content, Sider } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;

function App() {
  const [dbPath, setDbPath] = useState('');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableSchema, setTableSchema] = useState([]);
  const [tableData, setTableData] = useState(null);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [editingRow, setEditingRow] = useState(null);
  const [editForm] = Form.useForm();
  const [insertForm] = Form.useForm();
  const [insertModalVisible, setInsertModalVisible] = useState(false);

  const handleOpenDatabase = async () => {
    setLoading(true);
    try {
      const result = await OpenDatabase();
      setDbPath(result);
      message.success('Database opened successfully');
      
      const tablesList = await GetTables();
      setTables(tablesList);
      
      if (tablesList.length > 0) {
        setSelectedTable(tablesList[0]);
        const schema = await GetTableSchema(tablesList[0]);
        setTableSchema(schema);
      }
    } catch (error) {
      message.error(`Failed to open database: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDatabase = async () => {
    try {
      await CloseDatabase();
      setDbPath('');
      setTables([]);
      setSelectedTable(null);
      setTableSchema([]);
      setQueryResults(null);
      setQuery('');
      message.success('Database closed');
    } catch (error) {
      message.error(`Failed to close database: ${error}`);
    }
  };

  const handleSelectTable = async (tableName) => {
    setSelectedTable(tableName);
    try {
      const schema = await GetTableSchema(tableName);
      setTableSchema(schema);
      
      const data = await GetTableData(tableName);
      setTableData(data);
      
      setActiveTab('1');
    } catch (error) {
      message.error(`Failed to get table schema: ${error}`);
    }
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      message.warning('Please enter a query');
      return;
    }

    setLoading(true);
    try {
      const result = await ExecuteQuery(query);
      setQueryResults(result);
      setActiveTab('2');
      message.success('Query executed successfully');
    } catch (error) {
      message.error(`Query failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = async (rowIndex) => {
    if (!selectedTable || !tableData || rowIndex >= tableData.Rows.length) {
      return;
    }

    const row = tableData.Rows[rowIndex];
    const primaryKeyColumn = tableSchema.find(col => col.PrimaryKey);
    
    if (!primaryKeyColumn) {
      message.error('No primary key found, cannot delete row');
      return;
    }

    const primaryKeyIndex = tableData.Columns.indexOf(primaryKeyColumn.Name);
    const primaryKeyValue = row[primaryKeyIndex];

    setLoading(true);
    try {
      await DeleteRow(selectedTable, primaryKeyColumn.Name, primaryKeyValue);
      message.success('Row deleted successfully');
      
      const data = await GetTableData(selectedTable);
      setTableData(data);
    } catch (error) {
      message.error(`Failed to delete row: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRow = (rowIndex) => {
    if (!tableData || rowIndex >= tableData.Rows.length) {
      return;
    }

    const row = tableData.Rows[rowIndex];
    const formData = {};
    tableData.Columns.forEach((col, index) => {
      formData[col] = row[index];
    });
    
    editForm.setFieldsValue(formData);
    setEditingRow(rowIndex);
  };

  const handleUpdateRow = async (values) => {
    if (!selectedTable || editingRow === null || !tableData) {
      return;
    }

    const primaryKeyColumn = tableSchema.find(col => col.PrimaryKey);
    
    if (!primaryKeyColumn) {
      message.error('No primary key found, cannot update row');
      return;
    }

    const row = tableData.Rows[editingRow];
    const primaryKeyIndex = tableData.Columns.indexOf(primaryKeyColumn.Name);
    const primaryKeyValue = row[primaryKeyIndex];

    setLoading(true);
    try {
      for (const [column, value] of Object.entries(values)) {
        await UpdateRow(selectedTable, column, value, primaryKeyColumn.Name, primaryKeyValue);
      }
      
      message.success('Row updated successfully');
      setEditingRow(null);
      editForm.resetFields();
      
      const data = await GetTableData(selectedTable);
      setTableData(data);
    } catch (error) {
      message.error(`Failed to update row: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertRow = async (values) => {
    if (!selectedTable || !tableSchema) {
      return;
    }

    const orderedValues = tableSchema.map(col => values[col.Name] || '');
    
    setLoading(true);
    try {
      await InsertRow(selectedTable, orderedValues);
      message.success('Row inserted successfully');
      setInsertModalVisible(false);
      insertForm.resetFields();
      
      const data = await GetTableData(selectedTable);
      setTableData(data);
    } catch (error) {
      message.error(`Failed to insert row: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const schemaColumns = [
    {
      title: 'Column',
      dataIndex: 'Name',
      key: 'Name',
    },
    {
      title: 'Type',
      dataIndex: 'Type',
      key: 'Type',
    },
    {
      title: 'Primary Key',
      dataIndex: 'PrimaryKey',
      key: 'PrimaryKey',
      render: (value) => value ? 'Yes' : 'No',
    },
    {
      title: 'Not Null',
      dataIndex: 'NotNull',
      key: 'NotNull',
      render: (value) => value ? 'Yes' : 'No',
    },
    {
      title: 'Default',
      dataIndex: 'DefaultValue',
      key: 'DefaultValue',
      render: (value) => value || '-',
    },
  ];

  const resultColumns = queryResults?.Columns?.map((col, index) => ({
    title: col,
    dataIndex: index.toString(),
    key: index.toString(),
  })) || [];

  const resultDataSource = queryResults?.Rows?.map((row, index) => {
    const rowData = { key: index };
    row.forEach((value, colIndex) => {
      rowData[colIndex.toString()] = value;
    });
    return rowData;
  }) || [];

  const dataColumns = tableData?.Columns?.map((col, index) => ({
    title: col,
    dataIndex: index.toString(),
    key: index.toString(),
    editable: true,
  })) || [];

  const dataColumnsWithActions = [
    ...dataColumns,
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record, rowIndex) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditRow(rowIndex)}
            size="small"
          />
          <Popconfirm
            title="Delete this row?"
            onConfirm={() => handleDeleteRow(rowIndex)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const dataDataSource = tableData?.Rows?.map((row, index) => {
    const rowData = { key: index };
    row.forEach((value, colIndex) => {
      rowData[colIndex.toString()] = value;
    });
    return rowData;
  }) || [];

  return (
    <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DatabaseOutlined style={{ fontSize: '24px', color: '#fff' }} />
          <Title level={3} style={{ margin: 0, color: '#fff' }}>SQLite Viewer</Title>
        </div>
        <Space>
          {/* <Button onClick={() => ReloadWindow()}>Reload</Button> */}
          {dbPath ? (
            <Button type="primary" danger onClick={handleCloseDatabase}>Close Database</Button>
          ) : (
            <Button type="primary" icon={<FolderOpenOutlined />} onClick={handleOpenDatabase}>Open Database</Button>
          )}
        </Space>
      </Header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sider width={250} style={{ background: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <Text strong>Tables</Text>
          </div>
          {dbPath ? (
            <Menu
              mode="inline"
              selectedKeys={selectedTable ? [selectedTable] : []}
              style={{ borderRight: 0 }}
              items={tables.map(table => ({
                key: table,
                icon: <TableOutlined />,
                label: table,
                onClick: () => handleSelectTable(table),
              }))}
            />
          ) : (
            <div style={{ padding: '16px', color: '#999' }}>No database open</div>
          )}
        </Sider>
        <Content style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f0f0f0' }}>
          {!dbPath ? (
            <Card style={{ textAlign: 'center', marginTop: '100px' }}>
              <Empty
                image={<DatabaseOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
                description={
                  <div>
                    <Title level={4}>No Database Open</Title>
                    <Text type="secondary">Click "Open Database" to select an SQLite file</Text>
                  </div>
                }
              />
            </Card>
          ) : (
            <Spin spinning={loading}>
              <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                {
                  key: '1',
                  label: 'Table Schema',
                  icon: <TableOutlined />,
                  children: selectedTable ? (
                    <div>
                      <Title level={4}>Table: {selectedTable}</Title>
                      <Table
                        columns={schemaColumns}
                        dataSource={tableSchema.map((col, index) => ({ ...col, key: index }))}
                        pagination={false}
                        size="small"
                        rowSelection={null}
                      />
                    </div>
                  ) : (
                    <Empty description="Select a table to view its schema" />
                  ),
                },
                {
                  key: '2',
                  label: 'Data',
                  icon: <FileSearchOutlined />,
                  children: selectedTable ? (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setInsertModalVisible(true)}>
                          Insert Row
                        </Button>
                      </div>
                      <Table
                        columns={dataColumnsWithActions}
                        dataSource={dataDataSource}
                        pagination={{ pageSize: 50 }}
                        scroll={{ x: 'max-content' }}
                        size="small"
                        rowSelection={null}
                      />
                    </div>
                  ) : (
                    <Empty description="Select a table to view its data" />
                  ),
                },
                {
                  key: '3',
                  label: 'Query Editor',
                  icon: <FileSearchOutlined />,
                  children: (
                    <div>
                      <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <div>
                          <Space.Compact style={{ width: '100%' }}>
                            <TextArea
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder="Enter SELECT query..."
                              autoSize={{ minRows: 3, maxRows: 10 }}
                              style={{ fontFamily: 'monospace' }}
                            />
                            <Button
                              type="primary"
                              icon={<PlayCircleOutlined />}
                              onClick={handleExecuteQuery}
                              style={{ height: 'auto' }}
                            >
                              Execute
                            </Button>
                          </Space.Compact>
                        </div>
                        {queryResults && (
                          <Table
                            columns={resultColumns}
                            dataSource={resultDataSource}
                            pagination={{ pageSize: 50 }}
                            scroll={{ x: 'max-content' }}
                            size="small"
                            rowSelection={null}
                          />
                        )}
                      </Space>
                    </div>
                  ),
                },
              ]} />
              <div style={{ height: "80vh" }}></div>
            </Spin>
          )}
        </Content>
      </div>
      
      <Modal
        title="Insert Row"
        open={insertModalVisible}
        onCancel={() => {
          setInsertModalVisible(false);
          insertForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={insertForm}
          onFinish={handleInsertRow}
          layout="vertical"
        >
          {tableSchema.map(col => (
            <Form.Item
              key={col.Name}
              name={col.Name}
              label={col.Name}
              rules={col.NotNull ? [{ required: true, message: `${col.Name} is required` }] : []}
            >
              <Input />
            </Form.Item>
          ))}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Insert
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      <Modal
        title="Edit Row"
        open={editingRow !== null}
        onCancel={() => {
          setEditingRow(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          onFinish={handleUpdateRow}
          layout="vertical"
        >
          {tableSchema.map(col => (
            <Form.Item
              key={col.Name}
              name={col.Name}
              label={col.Name}
              rules={col.NotNull ? [{ required: true, message: `${col.Name} is required` }] : []}
            >
              <Input />
            </Form.Item>
          ))}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default App;
