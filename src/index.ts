'use strict';

import * as util from 'util';
import * as MDNS from 'multicast-dns';

const resolver = (hostname: string, rrtype: 'A'|'AAAA'|'PTR'|'TXT'|'SRV'|'HINFO', timeout: number, retryInterval: number, callback: Function) => {
  const mdns = MDNS();

  if (hostname.charAt(hostname.length - 1) === '.') {
    hostname = hostname.substring(0, hostname.length - 1);
  }

  const timeoutHandler = setTimeout(() => {

    clearInterval(retryHandler);

    mdns.removeListener('response', responseHandler);
    mdns.destroy();

    callback(new Error(`Could not resolve ${hostname} - Query Timed Out`));
  }, timeout);

  const retryHandler = setInterval(() => {
    mdns.query(hostname, rrtype);
  }, retryInterval);

  const responseHandler = (response) => {
    const cname = response.answers.find(x => x.name === hostname && x.type === 'CNAME');

    if (cname) {
      hostname = cname.data;
    }

    const answer = response.answers.find(x => x.name === hostname && x.type === rrtype);

    if (answer) {
      clearTimeout(timeoutHandler);
      clearInterval(retryHandler);

      mdns.removeListener('response', responseHandler);
      mdns.destroy();

      callback(null, answer.data);
    }
  };

  mdns.on('response', responseHandler);
  mdns.query(hostname, rrtype);
};

export const resolve = util.promisify(resolver) as
  (hostname: string, rrtype: 'A' | 'AAAA' | 'PTR' | 'TXT' | 'SRV' | 'HINFO', timeout: number, retryInterval: number) => Promise<string>;

export const resolve4 = (hostname: string, timeout: number, retryInterval: number) => resolve(hostname, 'A', timeout, retryInterval);
export const resolve6 = (hostname: string, timeout: number, retryInterval: number) => resolve(hostname, 'AAAA', timeout, retryInterval);
export const resolvePtr = (hostname: string, timeout: number, retryInterval: number) => resolve(hostname, 'PTR', timeout, retryInterval);
export const resolveTxt = (hostname: string, timeout: number, retryInterval: number) => resolve(hostname, 'TXT', timeout, retryInterval);
export const resolveSrv = (hostname: string, timeout: number, retryInterval: number) => resolve(hostname, 'SRV', timeout, retryInterval);
export const resolveHinfo = (hostname: string, timeout: number, retryInterval: number) => resolve(hostname, 'HINFO', timeout, retryInterval);
