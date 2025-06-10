import React, { useState } from 'react';
import DatePickerField from '../../components/form/DatePickerField';
import dayjs from 'dayjs';

export default function Reports() {
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Sales Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DatePickerField label="Start Date" value={startDate} onChange={setStartDate} />
        <DatePickerField label="End Date" value={endDate} onChange={setEndDate} />
      </div>
      {/* You can now use startDate and endDate to filter reports */}
    </div>
  );
}
