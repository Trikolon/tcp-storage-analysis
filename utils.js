// TODO: filter by origin, base domain, and partition.
// function getCookies({filterThirdParty = false} = {}) {
//     let cookies = Services.cookies.cookies;

//     if(!filterThirdParty) {
//         return cookies;
//     }

//     return cookies.filter(cookie => {
//         if(filterThirdParty && !cookie.originAttributes.partitionKey) {
//             return false;
//         }
//         return true;
//     });
// }

// function printCookies(filter) {
//     let cookies = getCookies(filter);
//     let cookiesPrintable = cookies.map((cookie) => ({
//         host: cookie.host,
//         creationTime: new Date(cookie.creationTime),
//         isPartitioned: !!cookie.originAttributes.partitionKey,
//     }))

//     console.info(cookiesPrintable);
// }

function isThirdPartyCookie(cookie) {
    return !!cookie.originAttributes.partitionKey;
}

function getThirdPartyCookieMap(thirdPartyCookies) {
    let thirdPartyCookieMap = {};
    thirdPartyCookies.forEach(cookie => {
        let { partitionKey } = cookie.originAttributes;
        let [, firstPartyBaseDomain] = partitionKey.split(",");
        if (partitionKey && !firstPartyBaseDomain) {
            console.warn("error while parsing partition key for cookie", cookie, partitionKey);
            return;
        }

        let thirdPartyBaseDomain;

        try {
            thirdPartyBaseDomain = Services.eTLD.getBaseDomainFromHost(cookie.rawHost);
        } catch (e) { }

        if (!thirdPartyBaseDomain) {
            console.warn("error while getting third party base domain for cookie", cookie);
            return;
        }

        if (!thirdPartyCookieMap[thirdPartyBaseDomain]) {
            thirdPartyCookieMap[thirdPartyBaseDomain] = [];
        }
        thirdPartyCookieMap[thirdPartyBaseDomain].push(cookie);
    });

    return thirdPartyCookieMap;
}

function printCookieStats() {
    let cookies = Services.cookies.cookies;
    let thirdPartyCookies = cookies.filter(isThirdPartyCookie);
    let thirdPartyCookieMap = getThirdPartyCookieMap(thirdPartyCookies);


    console.info("Total # cookies stored", cookies.length);
    console.info("# third-party cookies", thirdPartyCookies.length);

    // 3rdParty cookies grouped by base domain.
    // For each group: base domain, amount of cookies set, across how many different first parties?


    let thirdPartyCookieArray = Object.entries(thirdPartyCookieMap).map(([baseDomain, cookies]) => {

        //  TODO:
        let numUniqueFirstParties = 0;

        return {
            domain: baseDomain,
            numCookies: cookies.length,
            numUniqueFirstParties,
        };
    }).sort((a, b) => {
        return b.numCookies - a.numCookies;
    });

    console.debug("Third party cookies:", thirdPartyCookieArray);
}

// TODO:
function getStorageEntries() {
    Services.qms.listOrigins().map(origin => )
}