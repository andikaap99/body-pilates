import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Tabs } from 'expo-router';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: "#f1f5f9"},
      headerShadowVisible: false,
      tabBarStyle: {
          backgroundColor: "#f1f5f9",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
      },
      tabBarActiveTintColor: "#4b61afff",
      tabBarInactiveTintColor: "#999797ff"
    }}>
      <Tabs.Screen 
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={22} color={color} />
          ),
          headerShown: false
        }}
      />
      <Tabs.Screen 
        name="addClass"
        options={{
          title: "Add Class",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={22} color={color} />
          ),
          headerShown: false
        }}
      />
    </Tabs>
  );
}
