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
    // Проверяем каждые 30 секунд (на случай перезапуска бэкенда)
    const interval = setInterval(fetchVersion, 30000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <footer style={{
      marginTop: '24px',
      padding: '12px 24px',
      borderTop: '1px solid #e0e0e0',
      fontSize: '12px',
      color: '#666',
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      background: '#fafafa'
    }}>
      <div style={{ display: 'flex', gap: '24px' }}>
        <div>
          <strong>Frontend:</strong> v{packageJson.version}
        </div>
        <div>
          <strong>Backend:</strong>{' '}
          {loading ? (
            <span>loading...</span>
          ) : backendInfo ? (
            <>
              v{backendInfo.version} 
              {backendInfo.commit !== 'local' && (
                <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>
                  ({backendInfo.commit.slice(0, 7)})
                </span>
              )}
            </>
          ) : (
            <span style={{ color: '#d32f2f' }}>unavailable</span>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '24px' }}>
        <div>
          <strong>Environment:</strong>{' '}
          {backendInfo?.environment || import.meta.env.MODE}
        </div>
        {backendInfo?.timestamp && (
          <div>
            <strong>Updated:</strong>{' '}
            {new Date(backendInfo.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </footer>
  )
}