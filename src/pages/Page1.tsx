// PaginatedSearchableTable.tsx
import React, { useEffect, useState } from 'react';
import { Table, Input, Pagination } from 'antd';
import { Record, getPageData } from '../configs/indexDB';

const { Search } = Input;


const PaginatedSearchableTable: React.FC = () => {
  // Explicitly type the state as Record[] (an array of records)
  const [data, setData] = useState<Record[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const pageData = await getPageData(currentPage, searchTerm);
      console.log(pageData)
      setData(pageData);
      setLoading(false);
    };

    loadData();
  }, [currentPage, searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Search
        placeholder="Search by name"
        enterButton="Search"
        onSearch={handleSearch}
        style={{ marginBottom: '20px', width: '300px' }}
      />
      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={false}
        rowKey="id"
      />
      <Pagination
        current={currentPage}
        onChange={handlePageChange}
        total={30} // Assume 10 items per page, 3 pages
        pageSize={10}
        style={{ marginTop: '20px', textAlign: 'center' }}
      />
    </div>
  );
};

export default PaginatedSearchableTable;
