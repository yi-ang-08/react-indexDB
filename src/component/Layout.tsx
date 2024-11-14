import React from 'react';
import { Breadcrumb, Layout, Menu } from 'antd';
import PaginatedSearchableTable from '../pages/Page1';

const { Header, Content } = Layout;


const items = new Array(3).fill(null).map((_, index) => ({
  key: String(index + 1),
  label: `nav ${index + 1}`,
}));

const App: React.FC = () => {

  return (
    <Layout>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['1']}
          items={items}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Content style={{ padding: '0 48px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>List</Breadcrumb.Item>
          <Breadcrumb.Item>App</Breadcrumb.Item>
        </Breadcrumb>
        <div
          style={{
            padding: 24,
            minHeight: 380,
          }}
        >
          <PaginatedSearchableTable />
            {/* {key === '1' && }
            {key === '2' && <PaginatedSearchableTable2 />}
            {key === '3' && <></>} */}
        </div>
      </Content>
    </Layout>
  );
};

export default App;