
function isThirdPartyCookie(cookie) {
    return !!cookie.originAttributes.partitionKey;
}

/**
 * Get cookie map for an array of third-party cookies.
 * @param {string} groupBy
 * @returns {Object}
 */
function getCookieMap(cookies = Services.cookies.cookies, groupBy) {
    if(groupBy != "firstParty" && groupBy != "thirdParty") {
        throw new Error("Invalid value for groupBy argument.");
    }

    let cookieMap = {};
    cookies.forEach(cookie => {
        let key;

        if(groupBy == "firstParty") {
            let { partitionKey } = cookie.originAttributes;
            let [, partitionKeyBaseDomain] = partitionKey.substring(1, partitionKey.length - 1).split(",");

            if (partitionKey && !partitionKeyBaseDomain) {
                console.warn("error while parsing partition key for cookie", cookie, partitionKeyBaseDomain);
                return;
            }
            key = partitionKeyBaseDomain;
        } else {
            // third party grouping
            try {
                key = Services.eTLD.getBaseDomainFromHost(cookie.rawHost);
            } catch (e) { }
    
            if (!key) {
                console.warn("error while getting third party base domain for cookie", cookie);
                return;
            }
        }

        if(!key) {
            return;
        }

        if (!cookieMap[key]) {
            cookieMap[key] = [];
        }
        cookieMap[key].push(cookie);
    });

    return cookieMap;
}

function printCookieStats() {
    let cookies = Services.cookies.cookies;
    let thirdPartyCookies = cookies.filter(isThirdPartyCookie);
    let thirdPartyCookieMap = getCookieMap(thirdPartyCookies, "thirdParty");

    console.info("Total # cookies stored", cookies.length);
    console.info("# third-party cookies", thirdPartyCookies.length);

    // 3rdParty cookies grouped by base domain.
    // For each group: base domain, amount of cookies set, across how many different first party sites?

    let thirdPartyCookieArray = Object.entries(thirdPartyCookieMap).map(([baseDomain, cookies]) => {
        let firstPartyCookieMap = getCookieMap(cookies, "firstParty");

        return {
            domain: baseDomain,
            numCookies: cookies.length,
            numUniqueFirstParties: Object.values(firstPartyCookieMap).length,
            cookies,
        };
    }).sort((a, b) => {
        return b.numUniqueFirstParties - a.numUniqueFirstParties;
    });

    console.info("Third party cookies:", thirdPartyCookieArray);
}

// TODO: support for storage (localStorage, etc.)

printCookieStats();