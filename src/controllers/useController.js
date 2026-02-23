
import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch data using a controller method
 * @param {Function} fetcher - Controller method to call
 * @param {Array} args - Arguments for the controller method
 * @param {Array} deps - Dependency array for useEffect
 */
export function useController(fetcher, args = [], deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const result = await fetcher(...args);
            setData(result);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, deps);

    return { data, loading, error, refresh: fetchData };
}
