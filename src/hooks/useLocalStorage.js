import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // Get from local storage then
  // parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // If no item found, return initial value
      if (!item) return initialValue;
      
      // Try parsing as JSON first
      try {
        return JSON.parse(item);
      } catch {
        // If parsing fails, return the raw string
        return item;
      }
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = value => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      // If the value is a string and doesn't look like JSON, store it directly
      if (typeof valueToStore === 'string' && !valueToStore.startsWith('{') && !valueToStore.startsWith('[')) {
        window.localStorage.setItem(key, valueToStore);
      } else {
        // Otherwise stringify it
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}
