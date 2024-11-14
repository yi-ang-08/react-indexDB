import React, { useEffect, useState } from 'react';
import { Table, Input, Pagination, Spin } from 'antd';
import { getAllPatientRecords } from '../configs/indexDB';
import { PatientRecord } from '../configs/indexDB';

const { Search } = Input;

const PatientRecordsPage: React.FC = () => {
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  useEffect(() => {
    const loadPatientRecords = async () => {
      setLoading(true);

      // Fetch paginated records with search term
      const fetchedRecords = await getAllPatientRecords(searchTerm, currentPage, 10);
      setPatientRecords(fetchedRecords);

      // Fetch total count for pagination
      const allRecords = await getAllPatientRecords(searchTerm);
      setTotalRecords(allRecords.length);

      setLoading(false);
    };

    loadPatientRecords();
  }, [searchTerm, currentPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to the first page on search
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
            dataSource={patientRecords}
            pagination={false}
            rowKey="id"
          />
          <Pagination
            current={currentPage}
            onChange={handlePageChange}
            total={totalRecords}
            pageSize={10}
            style={{ marginTop: '20px', textAlign: 'center' }}
          />
        </>
      )}
    </div>
  );
};

export default PatientRecordsPage;
