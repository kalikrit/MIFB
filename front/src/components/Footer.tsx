import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import packageJson from '../../package.json'

interface VersionInfo {
  version: string
  commit: string
  environment: string
  timestamp: string
}

export const Footer = () => {
  const [backendInfo, setBackendInfo] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch(`${api.baseUrl}/api/version`)
        const data = await response.json()
        setBackendInfo(data)
      } catch (error) {
        console.error('Failed to fetch backend version:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchVersion()
    const interval = setInterval(fetchVersion, 30000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <footer className="app-footer">
      <div className="footer-info">
        <span>
          <strong>Фронтенд</strong> v{packageJson.version}
        </span>
        <span>
          <strong>Бэкенд</strong>{' '}
          {loading ? (
            'загрузка...'
          ) : backendInfo ? (
            <>
              v{backendInfo.version}
              <span className="footer-commit">
                {backendInfo.commit.slice(0, 7)}
              </span>
            </>
          ) : (
            'недоступен'
          )}
        </span>
        <span>
          <strong>Среда</strong> {backendInfo?.environment || import.meta.env.MODE}
        </span>
      </div>
      
      <div>
        {backendInfo?.timestamp && (
          <span>
            {new Date(backendInfo.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </footer>
  )
}