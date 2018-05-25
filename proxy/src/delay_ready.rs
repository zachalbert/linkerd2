use futures::{Async, Future, Poll};
use tokio::timer::Delay;
use tower_service::Service;

pub struct DelayReady<S> {
    delay: Option<Delay>,
    service: S,
}

impl<S: Service> DelayReady<S> {
    pub fn delay(delay: Delay, service: S) -> Self {
        Self {
            service,
            delay: Some(delay),
        }
    }

    pub fn immediate(service: S) -> Self {
        Self {
            service,
            delay: None,
        }
    }
}

impl<S: Service> Service for DelayReady<S> {
    type Request = S::Request;
    type Response = S::Response;
    type Error = S::Error;
    type Future = S::Future;

    fn poll_ready(&mut self) -> Poll<(), Self::Error> {
        if let Some(ref mut d) = self.delay {
            if d.poll().expect("timer").is_not_ready() {
                return Ok(Async::NotReady);
            }
        }
        self.delay = None;

        self.service.poll_ready()
    }

    fn call(&mut self, req: Self::Request) -> Self::Future {
        self.service.call(req)
    }
}
