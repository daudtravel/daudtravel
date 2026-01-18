const AuthLoader = () => {
  return (
    <div className="w-10 h-full inline-flex items-center justify-center">
      <div className="w-4 h-4 relative">
        <div className="w-4 h-4 rounded-full absolute border-2 border-solid border-gray-200"></div>
        <div className="w-4 h-4 rounded-full absolute border-2 border-solid border-orange-500 border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
};

export default AuthLoader;
