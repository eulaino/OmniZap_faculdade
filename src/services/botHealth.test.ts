import { HEALTH_TIMEOUT_MS, getBotHealthState } from './botHealth';

const onlineState = getBotHealthState({
  statusCode: 200,
  elapsedMs: 120,
});

const httpErrorState = getBotHealthState({
  statusCode: 500,
  elapsedMs: 120,
});

const timeoutState = getBotHealthState({
  statusCode: 200,
  elapsedMs: HEALTH_TIMEOUT_MS + 1,
});

const networkErrorState = getBotHealthState({
  elapsedMs: 120,
  error: new Error('Network Error'),
});

if (onlineState !== 'online') {
  throw new Error('Expected HTTP 200 under timeout to be online');
}

if (httpErrorState !== 'offline') {
  throw new Error('Expected HTTP errors to be offline');
}

if (timeoutState !== 'offline') {
  throw new Error('Expected slow health checks to be offline');
}

if (networkErrorState !== 'offline') {
  throw new Error('Expected network errors to be offline');
}
