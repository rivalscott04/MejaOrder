'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import OrderCard from '@/components/kds/OrderCard';

interface Order {
    id: number;
    order_code: string;
    table: { table_number: string };
    created_at: string;
    order_status: string;
    items: any[];
}

export default function KdsPage() {
    const params = useParams();
    const tenantSlug = params.tenantSlug as string;
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchOrders = async () => {
        try {
            // In a real app, we would use an axios instance with interceptors for auth
            // For now, assuming the user is logged in via cookie/session
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const response = await fetch(`${backendUrl}/api/kds/orders`, {
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data.data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: number, status: string) => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const response = await fetch(`${backendUrl}/api/kds/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ kitchen_status: status }),
            });

            if (response.ok) {
                fetchOrders(); // Refresh immediately
            }
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">KITCHEN DISPLAY SYSTEM</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                        Tenant: {tenantSlug}
                    </span>
                    <span className="text-sm text-gray-400">
                        Last update: {lastUpdated.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={() => document.documentElement.requestFullscreen()}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                    >
                        Fullscreen
                    </button>
                </div>
            </div>

            {loading && orders.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <p className="text-xl animate-pulse">Loading orders...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {orders.map((order) => (
                        <div key={order.id} className="h-[400px]">
                            <OrderCard order={order} onUpdateStatus={updateStatus} />
                        </div>
                    ))}
                    {orders.length === 0 && (
                        <div className="col-span-full flex justify-center items-center h-64 text-gray-500">
                            <p className="text-xl">Tidak ada pesanan aktif</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
