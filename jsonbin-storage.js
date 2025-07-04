/**
 * JSONBin.io 数据存储服务
 * 用于实现跨用户数据共享
 */
class JSONBinStorage {
    constructor() {
        // JSONBin.io API 配置
        this.baseUrl = 'https://api.jsonbin.io/v3';
        this.apiKey = $2a$10$JLdhPZr4wywmMUvgcqh7HOr.OwNBl5EWCf5SCRhMQAWKdYTlX1Ncm

        
        // 数据存储的 Bin ID（需要预先创建）
        this.bins = {
            pendingProjects: '686806a28960c979a5b7202a',
            votingProjects: '686805a68a456b7966bb5c02',
            pendingResults: '686804868561e97a50318707',
            userPoints: '686804568561e97a5031866a',
            frozenPoints: '686804218561e97a5031866c7',
            pointsHistory: '686803da8a456b7966bb5b1a'
        };
        
        // 本地缓存
        this.cache = {};
        this.cacheTimeout = 30000; // 30秒缓存
    }
    
    /**
     * 获取请求头
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Master-Key': this.apiKey,
            'X-Access-Key': '$2a$10$YOUR_ACCESS_KEY_HERE' // 可选的访问密钥
        };
    }
    
    /**
     * 读取数据
     * @param {string} binType - 数据类型 (pendingProjects, votingProjects, etc.)
     * @param {boolean} useCache - 是否使用缓存
     */
    async loadData(binType, useCache = true) {
        try {
            // 检查缓存
            if (useCache && this.cache[binType] && 
                Date.now() - this.cache[binType].timestamp < this.cacheTimeout) {
                return this.cache[binType].data;
            }
            
            const binId = this.bins[binType];
            if (!binId || binId.includes('YOUR_')) {
                console.warn(`Bin ID for ${binType} not configured, using localStorage fallback`);
                return this.getLocalStorageFallback(binType);
            }
            
            const response = await fetch(`${this.baseUrl}/b/${binId}/latest`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            const data = result.record || [];
            
            // 更新缓存
            this.cache[binType] = {
                data: data,
                timestamp: Date.now()
            };
            
            return data;
        } catch (error) {
            console.error(`Failed to load ${binType}:`, error);
            // 降级到 localStorage
            return this.getLocalStorageFallback(binType);
        }
    }
    
    /**
     * 保存数据
     * @param {string} binType - 数据类型
     * @param {any} data - 要保存的数据
     */
    async saveData(binType, data) {
        try {
            const binId = this.bins[binType];
            if (!binId || binId.includes('YOUR_')) {
                console.warn(`Bin ID for ${binType} not configured, using localStorage fallback`);
                this.setLocalStorageFallback(binType, data);
                return true;
            }
            
            const response = await fetch(`${this.baseUrl}/b/${binId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // 更新缓存
            this.cache[binType] = {
                data: data,
                timestamp: Date.now()
            };
            
            // 同时保存到 localStorage 作为备份
            this.setLocalStorageFallback(binType, data);
            
            return true;
        } catch (error) {
            console.error(`Failed to save ${binType}:`, error);
            // 降级到 localStorage
            this.setLocalStorageFallback(binType, data);
            return false;
        }
    }
    
    /**
     * localStorage 降级方案
     */
    getLocalStorageFallback(binType) {
        const key = `global_${binType}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }
    
    setLocalStorageFallback(binType, data) {
        const key = `global_${binType}`;
        localStorage.setItem(key, JSON.stringify(data));
    }
    
    /**
     * 清除缓存
     */
    clearCache(binType = null) {
        if (binType) {
            delete this.cache[binType];
        } else {
            this.cache = {};
        }
    }
    
    /**
     * 检查网络连接状态
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/b`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 初始化 - 创建必要的 Bins
     * 注意：这个方法需要手动调用一次来创建 Bins
     */
    async initializeBins() {
        const binTypes = Object.keys(this.bins);
        const results = {};
        
        for (const binType of binTypes) {
            try {
                const response = await fetch(`${this.baseUrl}/b`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify([])
                });
                
                if (response.ok) {
                    const result = await response.json();
                    results[binType] = result.metadata.id;
                    console.log(`Created bin for ${binType}: ${result.metadata.id}`);
                } else {
                    console.error(`Failed to create bin for ${binType}`);
                }
            } catch (error) {
                console.error(`Error creating bin for ${binType}:`, error);
            }
        }
        
        return results;
    }
}

// 创建全局实例
const jsonBinStorage = new JSONBinStorage();

// 导出供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSONBinStorage;
}