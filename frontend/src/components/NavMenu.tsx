import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavMenu: React.FC = () => {
  const location = useLocation();

  return (
    <nav style={{ 
      background: '#333', 
      padding: '10px', 
      marginBottom: '20px' 
    }}>
      <ul style={{ 
        display: 'flex', 
        listStyle: 'none', 
        gap: '20px', 
        justifyContent: 'center',
        margin: 0,
        padding: 0
      }}>
        <li>
          <Link 
            to="/" 
            style={{ 
              color: location.pathname === '/' ? '#61dafb' : 'white', 
              textDecoration: 'none',
              fontWeight: location.pathname === '/' ? 'bold' : 'normal'
            }}
          >
            首页
          </Link>
        </li>
        <li>
          <Link 
            to="/test-connection" 
            style={{ 
              color: location.pathname === '/test-connection' ? '#61dafb' : 'white', 
              textDecoration: 'none',
              fontWeight: location.pathname === '/test-connection' ? 'bold' : 'normal'
            }}
          >
            测试后端连接
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavMenu;
