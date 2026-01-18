const FilterSectionLoader = () => {
  return (
    <div className="w-full max-h-[500px] animate-pulse flex items-center justify-center">
      <div className="w-8 h-8 relative">
        <div className="w-8 h-8 rounded-full absolute border-4 border-solid border-gray-200"></div>
        <div className="w-8 h-8 rounded-full absolute border-4 border-solid border-orange-500 border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
};

export default FilterSectionLoader;
