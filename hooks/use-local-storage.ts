"use client"

import { useState, useEffect, useRef } from "react"

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Prevent initial useEffect from triggering a re-render
  const isFirstRender = useRef(true)

  // Keep track of the last saved value to avoid unnecessary writes
  const lastSavedValue = useRef<string>("")

  // Initialize state on mount
  useEffect(() => {
    try {
      // Skip on first render to prevent double initialization
      if (isFirstRender.current) {
        isFirstRender.current = false

        // Get from local storage by key
        const item = window.localStorage.getItem(key)
        // Parse stored json or if none return initialValue
        if (item) {
          const parsedItem = JSON.parse(item)
          setStoredValue(parsedItem)
          // Store the stringified value for comparison
          lastSavedValue.current = item
        }
        return
      }
    } catch (error) {
      // If error also return initialValue
      console.error("Error reading from localStorage:", error)
    }
  }, [key]) // Only re-run effect if key changes

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Save state
      setStoredValue(valueToStore)

      // Save to local storage - but only if the value has changed
      const stringifiedValue = JSON.stringify(valueToStore)
      if (stringifiedValue !== lastSavedValue.current) {
        window.localStorage.setItem(key, stringifiedValue)
        lastSavedValue.current = stringifiedValue
        console.log(`Saved to localStorage: ${key}`)
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error("Error writing to localStorage:", error)
    }
  }

  return [storedValue, setValue]
}

