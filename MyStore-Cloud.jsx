ow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white text-blue-600 p-3 rounded-full">
                <span className="text-2xl">🛍️</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">My Store</h1>
                <p className="text-blue-100 text-sm">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-blue-100 text-sm">পণ্য</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition"
              >
                <LogOut size={18} /> লগআউট
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* সার্চ এবং বাটন */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="পণ্য খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition"
            />
            {filteredProducts.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">{filteredProducts.length} টি পণ্য পাওয়া গেছে</p>
            )}
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({name: '', price: '', category: '', description: '', image: null});
            }}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition shadow-lg"
          >
            <Plus size={20} /> নতুন পণ্য যোগ করুন
          </button>
        </div>

        {/* ফর্ম */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8 border-l-4 border-blue-500">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingId ? 'পণ্য আপডেট করুন' : 'নতুন পণ্য যোগ করুন'}
            </h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">পণ্যের নাম *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="যেমন: শার্ট, প্যান্ট..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">দাম (টাকা) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="যেমন: 500, 1000..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">বিভাগ</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="পোশাক">পোশাক</option>
                  <option value="জুতা">জুতা</option>
                  <option value="ইলেকট্রনিক্স">ইলেকট্রনিক্স</option>
                  <option value="বই">বই</option>
                  <option value="খেলনা">খেলনা</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">ছবি</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">বিবরণ</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="পণ্য সম্পর্কে বিস্তারিত..."
                  rows="3"
                />
              </div>

              {formData.image && (
                <div className="md:col-span-2">
                  <img src={formData.image} alt="Preview" className="h-32 w-32 object-cover rounded-lg" />
                </div>
              )}

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'অপেক্ষা করুন...' : (editingId ? 'আপডেট করুন' : 'যোগ করুন')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({name: '', price: '', category: '', description: '', image: null});
                  }}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition"
                >
                  বাতিল করুন
                </button>
              </div>
            </form>
          </div>
        )}

        {/* পণ্যের তালিকা */}
        <div>
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'কোন পণ্য পাওয়া যায়নি' : 'এখনও কোন পণ্য নেই'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:scale-105"
                >
                  <div className="relative bg-gray-200 h-48 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                    )}
                    {product.category && (
                      <span className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {product.category}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="text-2xl font-bold text-green-600 mb-4">
                      ৳ {product.price}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition text-sm"
                      >
                        এডিট
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                      >
                        <Trash2 size={16} /> ডিলিট
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 text-white text-center py-6 mt-16">
        <p className="text-sm">© 2024 My Store - আপনার ক্লাউড ভিত্তিক অনলাইন দোকান</p>
        <p className="text-xs text-gray-400 mt-2">যেকোনো ডিভাইস থেকে আপনার পণ্য অ্যাক্সেস করুন</p>
      </div>
    </div>
  );
}