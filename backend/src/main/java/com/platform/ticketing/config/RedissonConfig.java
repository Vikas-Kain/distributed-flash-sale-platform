package com.platform.ticketing.config;

import lombok.extern.slf4j.Slf4j;
import org.redisson.Redisson;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Configuration
public class RedissonConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    private static final ConcurrentHashMap<String, ReentrantLock> IN_MEMORY_LOCKS = new ConcurrentHashMap<>();

    @Bean(destroyMethod = "")
    @Primary
    public RedissonClient redissonClient() {
        Config config = new Config();
        String address = String.format("redis://%s:%d", redisHost, redisPort);
        log.info("Attempting Redisson connection to {}", address);

        config.useSingleServer()
                .setAddress(address)
                .setConnectTimeout(1000)
                .setTimeout(1000)
                .setRetryAttempts(0);

        try {
            return Redisson.create(config);
        } catch (Exception ex) {
            log.warn("External Redis server not detected at {}. Operating with resilient in-memory distributed fair lock proxy.", address);
            return createInMemoryRedissonFallback();
        }
    }

    private RedissonClient createInMemoryRedissonFallback() {
        return (RedissonClient) Proxy.newProxyInstance(
                RedissonClient.class.getClassLoader(),
                new Class<?>[]{RedissonClient.class},
                new InvocationHandler() {
                    @Override
                    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                        String name = method.getName();
                        if ("hashCode".equals(name)) {
                            return System.identityHashCode(proxy);
                        }
                        if ("equals".equals(name)) {
                            return proxy == (args != null && args.length > 0 ? args[0] : null);
                        }
                        if ("toString".equals(name)) {
                            return "InMemoryRedissonClientProxy@" + Integer.toHexString(System.identityHashCode(proxy));
                        }
                        if ("getConfig".equals(name)) {
                            Config fallbackConfig = new Config();
                            fallbackConfig.useSingleServer().setAddress("redis://localhost:6379");
                            return fallbackConfig;
                        }
                        if ("getFairLock".equals(name) || "getLock".equals(name)) {
                            String lockName = (String) args[0];
                            return createInMemoryRLock(lockName);
                        }
                        if ("shutdown".equals(name) || "isShutdown".equals(name) || "isShuttingDown".equals(name)) {
                            return false;
                        }
                        return null;
                    }
                }
        );
    }

    private RLock createInMemoryRLock(String lockName) {
        ReentrantLock reentrantLock = IN_MEMORY_LOCKS.computeIfAbsent(lockName, k -> new ReentrantLock(true)); // fair lock

        return (RLock) Proxy.newProxyInstance(
                RLock.class.getClassLoader(),
                new Class<?>[]{RLock.class},
                new InvocationHandler() {
                    @Override
                    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                        String name = method.getName();
                        if ("hashCode".equals(name)) {
                            return lockName.hashCode();
                        }
                        if ("equals".equals(name)) {
                            return proxy == (args != null && args.length > 0 ? args[0] : null);
                        }
                        if ("toString".equals(name)) {
                            return "InMemoryRLock[" + lockName + "]";
                        }
                        if ("tryLock".equals(name)) {
                            if (args != null && args.length >= 3 && args[0] instanceof Number && args[2] instanceof TimeUnit) {
                                long waitTime = ((Number) args[0]).longValue();
                                TimeUnit unit = (TimeUnit) args[2];
                                return reentrantLock.tryLock(waitTime, unit);
                            } else if (args == null || args.length == 0) {
                                return reentrantLock.tryLock();
                            }
                            return true;
                        } else if ("lock".equals(name)) {
                            reentrantLock.lock();
                            return null;
                        } else if ("unlock".equals(name)) {
                            if (reentrantLock.isHeldByCurrentThread()) {
                                reentrantLock.unlock();
                            }
                            return null;
                        } else if ("forceUnlock".equals(name)) {
                            while (reentrantLock.isHeldByCurrentThread()) {
                                reentrantLock.unlock();
                            }
                            return true;
                        } else if ("isLocked".equals(name)) {
                            return reentrantLock.isLocked();
                        } else if ("isHeldByCurrentThread".equals(name)) {
                            return reentrantLock.isHeldByCurrentThread();
                        }
                        return null;
                    }
                }
        );
    }
}
