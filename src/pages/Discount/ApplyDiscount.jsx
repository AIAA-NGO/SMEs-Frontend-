import React from 'react';
import DiscountForm from '../../components/Discount/DiscountForm';
import DiscountList from '../../components/Discount/DiscountList';

const DiscountPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <DiscountForm />
      <DiscountList />
    </div>
  );
};

export default DiscountPage;