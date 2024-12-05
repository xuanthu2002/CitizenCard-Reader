import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import './index.css';
import store from './redux/store';
import reportWebVitals from './reportWebVitals';
import { ConfigProvider } from 'antd';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ConfigProvider
            theme={{
                token: { borderRadius: 0 },
            }}
        >
            <Provider store={store}>
                <App />
            </Provider>
        </ConfigProvider>
    </React.StrictMode>,
);

reportWebVitals();
