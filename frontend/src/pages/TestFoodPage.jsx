import { useState, useEffect } from "react";

const TestFoodPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log("🧪 Testing API calls...");

        // Test cafes API
        const cafesResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/cafe/public/list`
        );
        const cafesData = await cafesResponse.json();
        console.log("🏪 Cafes:", cafesData);

        // Test menu API for first cafe
        if (cafesData.data && cafesData.data.length > 0) {
          const cafeId = cafesData.data[0].id;
          console.log(`📋 Testing menu for cafe: ${cafeId}`);

          const menuResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/menu/${cafeId}/public/menu`
          );
          const menuData = await menuResponse.json();
          console.log("📋 Menu:", menuData);

          // Process the data
          const foodItems = [];
          menuData.data?.forEach((category) => {
            console.log(`📂 Category: ${category.name}`, category);
            category.items?.forEach((item) => {
              console.log(`🍕 Item: ${item.name}`, item);
              foodItems.push({
                ...item,
                cafe: {
                  id: cafesData.data[0].id,
                  name: cafesData.data[0].name,
                  logo_url: cafesData.data[0].logo_url,
                },
                category: category.name,
              });
            });
          });

          console.log("🍽️ Processed food items:", foodItems);
          setData({ cafes: cafesData.data, menu: menuData.data, foodItems });
        }
      } catch (error) {
        console.error("❌ Error:", error);
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Results</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Cafes ({data?.cafes?.length || 0})
        </h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(data?.cafes, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Menu Categories ({data?.menu?.length || 0})
        </h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(data?.menu, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Food Items ({data?.foodItems?.length || 0})
        </h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(data?.foodItems, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestFoodPage;
