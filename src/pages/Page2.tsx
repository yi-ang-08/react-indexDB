import React, { useEffect, useState } from 'react';
import { Table, Input, Pagination, Spin } from 'antd';
import { getPatientRecords } from '../configs/indexDB';
import { PatientRecord } from '../configs/indexDB';

const { Search } = Input;

const PatientRecordsPage: React.FC = () => {
  const [data, setData] = useState<PatientRecord[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const pageData = await getPatientRecords(currentPage, searchTerm);
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
    {
      title: 'Diagnosis',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => new Date(createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Search
        placeholder="Search by name or diagnosis"
        enterButton="Search"
        onSearch={handleSearch}
        style={{ marginBottom: '20px', width: '300px' }}
      />
      {loading ? (
        <Spin size="large" />
      ) : (
        <>
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
            total={10000}
            pageSize={10}
            style={{ marginTop: '20px', textAlign: 'center' }}
          />
        </>
      )}
    </div>
  );
};

export default PatientRecordsPage;
