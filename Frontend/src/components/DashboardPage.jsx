// src/components/DashboardPage.jsx
import React, {useContext} from "react";
import {UserContext} from "../App";
import AdminDashboard from "./AdminDashboard";
import ClientDashboard from "./ClientDashboard";

function DashboardPage() {
    const {user} = useContext(UserContext);

    // بررسی اینکه کاربر وجود دارد یا خیر
    if (!user) return null;

    // اگر ادمین یا سوپریوزر بود -> داشبورد ادمین
    const isAdmin = user.role === 'admin' || user.role === 'superuser' || user.is_superuser;

    if (isAdmin) {
        return <AdminDashboard/>;
    } else {
        return <ClientDashboard/>;
    }
}

export default DashboardPage;