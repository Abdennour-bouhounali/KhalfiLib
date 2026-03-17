import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../services/database';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (user: User) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load user from storage on mount
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Failed to load user from storage:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (userData: User) => {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
