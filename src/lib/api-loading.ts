// Tiny store that counts in-flight API calls so one global indicator (<ApiLoader />) can
// reflect all of them. Every call made through services/generalservice_service.js is wrapped
// with trackApiCall(), so screens don't need to do anything.

type Listener = () => void;

let pending = 0;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((listener) => listener());

export const subscribeApiLoading = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getPendingApiCalls = () => pending;

export function trackApiCall<T>(run: () => Promise<T>): Promise<T> {
  pending += 1;
  emit();

  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    pending = Math.max(0, pending - 1);
    emit();
  };

  try {
    return run().finally(done);
  } catch (error) {
    done();
    throw error;
  }
}
