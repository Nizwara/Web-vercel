import type { Proxy } from "@/types/proxy"
import { getEmojiFlag } from "./utils"

// Cache for generated UUIDs to improve performance
const uuidCache: Record<string, string> = {}

// Update the getServerConfig function to properly handle the three different server types
function getServerConfig(
  bugServer: string,
  hostname: string,
  serverType: string,
  useWildcard: boolean,
): { server: string; sniHost: string } {
  // Check if we're using a bug server
  const isBugServerActive = bugServer && bugServer !== hostname

  // If no bug server is active, use regular configuration
  if (!isBugServerActive) {
    return {
      server: hostname, // server = hostname (only)
      sniHost: hostname, // sni & host = hostname (only)
    }
  }

  // Bug server is active, handle the 3 options based on serverType
  if (serverType === "WS") {
    // Websocket: server = bugserver, sni & host = hostname
    return {
      server: bugServer,
      sniHost: hostname,
    }
  } else if (serverType === "WS-WILD") {
    // Wildcard WS: server = bugserver, sni & host = bugserver.hostname
    return {
      server: bugServer,
      sniHost: `${bugServer}.${hostname}`,
    }
  } else if (serverType === "SSL") {
    // Wildcard SSL: server = hostname, sni & host = bugserver.hostname
    return {
      server: hostname,
      sniHost: `${bugServer}.${hostname}`,
    }
  }

  // Default fallback (should not reach here if serverType is valid)
  return {
    server: hostname,
    sniHost: hostname,
  }
}

// Update the generateConfigs function to handle the consolidated fields
export function generateConfigs(
  hostName: string,
  proxy: Proxy,
  nameWEB: string,
  pathinfo: string,
  useWildcard = false,
  wildcardSubdomain = "",
  wildcardFullHost = "",
  settings?: any,
) {
  const { proxyIP, proxyPort, country, org } = proxy

  const bugServer = wildcardSubdomain || hostName

  // Determine default settings if not provided
  const defaultSettings = {
    sslServers: [hostName], // Default to using the hostName as the SSL server
    defaultServerType: "WS",
    defaultHostname: hostName,
  }

  // Use settings that are provided or default if not
  const configSettings = settings || defaultSettings

  // Log for debugging
  console.log("generateConfigs settings:", {
    sslServers: configSettings.sslServers,
    serverType: configSettings.defaultServerType,
    hostname: configSettings.defaultHostname,
    useWildcard: useWildcard,
    bugServer: bugServer,
  })

  // Determine the actual server, sni and host values based on the new rules
  const { server: serverHost, sniHost } = getServerConfig(
    bugServer,
    configSettings.defaultHostname || hostName,
    configSettings.defaultServerType || "WS",
    useWildcard,
  )

  // Log final configuration
  console.log("Final configuration:", { serverHost, sniHost, useWildcard, bugServer })

  // Helper functions
  const encodePath = (pathinfo: string, proxyIP: string, proxyPort: string) => {
    const cleanedProxyIP = proxyIP.trim()
    return `%2F${encodeURIComponent(pathinfo)}%2F${encodeURIComponent(cleanedProxyIP)}%2F${encodeURIComponent(proxyPort)}`
  }

  const encodePathRT = (pathinfo: string, country: string) => {
    return `%2F${encodeURIComponent(pathinfo)}%2F${encodeURIComponent(country)}`
  }

  const encodeSpace = (string: string) => {
    return encodeURIComponent(string).replace(/\s+/g, "")
  }

  // Generate paths
  const pathcode = encodePath(pathinfo, proxyIP, proxyPort)

  // Create ISP name with flag emoji
  const ispName = `${getEmojiFlag(country)} ${org}`
  const encodedIspName = encodeSpace(ispName)

  const clashpath = `/${pathinfo}/${proxyIP}/${proxyPort}`

  const RTpath = encodePathRT(pathinfo, country)
  const RTname = `${getEmojiFlag(country)} (${country})`

  // Generate UUIDs - use cached values if available for better performance
  const generateUUID = () => {
    const cacheKey = `${proxyIP}:${proxyPort}`
    if (!uuidCache[cacheKey]) {
      uuidCache[cacheKey] = crypto.randomUUID()
    }
    return uuidCache[cacheKey]
  }

  // Generate config strings - FIXED TLS and N-TLS configurations
  // TLS configs use port 443, security=tls, and the proper SNI
  const vlessTls = `vless://${generateUUID()}@${serverHost}:443?encryption=none&security=tls&sni=${sniHost}&fp=randomized&type=ws&host=${sniHost}&path=${pathcode}#${ispName}-[Tls]-[VL]-[${nameWEB}]`

  // N-TLS configs use port 80, security=none, and the proper host
  const vlessNTls = `vless://${generateUUID()}@${serverHost}:80?encryption=none&security=none&type=ws&host=${sniHost}&path=${pathcode}#${ispName}-[NTls]-[VL]-[${nameWEB}]`

  const trojanTls = `trojan://${generateUUID()}@${serverHost}:443?security=tls&sni=${sniHost}&fp=randomized&type=ws&host=${sniHost}&path=${pathcode}#${ispName}-[Tls]-[TR]-[${nameWEB}]`
  const trojanNTls = `trojan://${generateUUID()}@${serverHost}:80?security=none&type=ws&host=${sniHost}&path=${pathcode}#${ispName}-[NTls]-[TR]-[${nameWEB}]`

  // Updated Shadowsocks format based on the example
  const ssTls = `ss://${btoa(`none:${generateUUID()}`)}@${serverHost}:443?encryption=none&type=ws&host=${sniHost}&path=${pathcode}&security=tls&sni=${sniHost}#${ispName}-[Tls]-[SS]-[${nameWEB}]`
  const ssNTls = `ss://${btoa(`none:${generateUUID()}`)}@${serverHost}:80?encryption=none&type=ws&host=${sniHost}&path=${pathcode}&security=none#${ispName}-[NTls]-[SS]-[${nameWEB}]`

  // Rotate configs with updated format
  const RTvlessTls = `vless://${generateUUID()}@${serverHost}:443?encryption=none&security=tls&sni=${sniHost}&fp=randomized&type=ws&host=${sniHost}&path=${RTpath}#${RTname}-[Tls]-[VL]-[${nameWEB}]`
  const RTtrojanTls = `trojan://${generateUUID()}@${serverHost}:443?security=tls&sni=${sniHost}&fp=randomized&type=ws&host=${sniHost}&path=${RTpath}#${RTname}-[Tls]-[TR]-[${nameWEB}]`
  const RTssTls = `ss://${btoa(`none:${generateUUID()}`)}@${serverHost}:443?encryption=none&type=ws&host=${sniHost}&path=${RTpath}&security=tls&sni=${sniHost}#${RTname}-[Tls]-[SS]-[${nameWEB}]`

  // Clash configs
  const vlname = `${ispName}-[Tls]-[VL]-[${nameWEB}]`
  const trname = `${ispName}-[Tls]-[TR]-[${nameWEB}]`
  const ssname = `${ispName}-[Tls]-[SS]-[${nameWEB}]`

  const clashVLTls = `
#InconigtoVPN
proxies:
- name: ${vlname}
  server: ${serverHost}
  port: 443
  type: vless
  uuid: ${generateUUID()}
  cipher: auto
  tls: true
  client-fingerprint: chrome
  udp: false
  skip-cert-verify: true
  network: ws
  servername: ${sniHost}
  alpn:
    - h2
    - h3
    - http/1.1
  ws-opts:
    path: ${clashpath}
    headers:
      Host: ${sniHost}
    max-early-data: 0
    early-data-header-name: Sec-WebSocket-Protocol
    ip-version: dual
    v2ray-http-upgrade: false
    v2ray-http-upgrade-fast-open: false
`

  const clashTRTls = `
#InconigtoVPN
proxies:      
- name: ${trname}
  server: ${serverHost}
  port: 443
  type: trojan
  password: ${generateUUID()}
  tls: true
  client-fingerprint: chrome
  udp: false
  skip-cert-verify: true
  network: ws
  sni: ${sniHost}
  alpn:
    - h2
    - h3
    - http/1.1
  ws-opts:
    path: ${clashpath}
    headers:
      Host: ${sniHost}
    max-early-data: 0
    early-data-header-name: Sec-WebSocket-Protocol
    ip-version: dual
    v2ray-http-upgrade: false
    v2ray-http-upgrade-fast-open: false
`

  const clashSSTls = `
#InconigtoVPN
proxies:
- name: ${ssname}
  server: ${serverHost}
  port: 443
  type: ss
  cipher: none
  password: ${generateUUID()}
  plugin: v2ray-plugin
  client-fingerprint: chrome
  udp: false
  plugin-opts:
    mode: websocket
    host: ${sniHost}
    path: ${clashpath}
    tls: true
    mux: false
    skip-cert-verify: true
  headers:
    custom: value
    ip-version: dual
    v2ray-http-upgrade: false
    v2ray-http-upgrade-fast-open: false
`

  // Combine all configs
  const allConfigs = [ssTls, ssNTls, vlessTls, vlessNTls, trojanTls, trojanNTls, RTvlessTls, RTtrojanTls, RTssTls].join(
    "\n\n",
  )

  return {
    vlessTls,
    vlessNTls,
    trojanTls,
    trojanNTls,
    ssTls,
    ssNTls,
    RTvlessTls,
    RTtrojanTls,
    RTssTls,
    clashVLTls,
    clashTRTls,
    clashSSTls,
    allConfigs,
  }
}

