import type {Metadata} from 'next';
import DealStatus from '../deal-status';
import {nbaStatus} from '../../lib/game-checks';

export const metadata:Metadata={title:'Timberwolves Chick-fil-A Deal: Free Chicken Today?',description:'Check whether the Timberwolves Chick-fil-A deal is active today. See the Bricken for Chicken rules, claim deadline, and how to redeem.',alternates:{canonical:'/chick-fil-a'}};

export default async function Guide(){
 const initial=await nbaStatus(new Date());
 return <main className="reading">
  <div className="page-title"><p className="eyebrow">TIMBERWOLVES × CHICK-FIL-A</p><h1>Is the Timberwolves Chick-fil-A deal active today?</h1><p>Terms reviewed September 30, 2026 · all times Central</p></div>
  <article className="guide">
   <DealStatus id="bricken" initial={initial} showGameCheck/>
   <h2>How Bricken for Chicken works</h2>
   <p>A visiting player must miss two consecutive free throws in the fourth quarter of a Timberwolves home game. Claim the offer in the Chick-fil-A app by 10:30 a.m. the next day and redeem by 9 p.m., Central time.</p>
   <h2>How to claim</h2>
   <ol>
    <li><strong>Before 10:30 a.m. the next day:</strong> open the Chick-fil-A app, sign in, and enable location services in the eligible market. Find and claim the offer.</li>
    <li><strong>After claiming:</strong> look in My Rewards and check the exact item, restaurant eligibility and expiration.</li>
    <li><strong>By 9 p.m. that day:</strong> apply the reward at a participating Twin Cities or St. Cloud, Minnesota restaurant. Check the restaurant’s opening hours.</li>
   </ol>
   <p><a className="button navy" href="https://www.chick-fil-a.com/app">Open Chick-fil-A app</a></p>
   <h2>Quick answers</h2>
   <div className="guide-faq">
    <details open><summary>Did the Timberwolves unlock free chicken today?</summary><p>Today’s status is at the top of this page, with a short explanation of why the deal is—or isn’t—active. During the season, the game check shows the most recent game from today or yesterday, including its opponent, date and home or away location.</p></details>
    <details><summary>Does an away game count?</summary><p>No. Bricken for Chicken requires a qualifying fourth-quarter trigger at a Timberwolves home game. Two missed free throws in an away game don’t unlock this offer.</p></details>
    <details><summary>Which app do I use?</summary><p>The current 2026–27 claim terms direct you to the Chick-fil-A app. Sign in and enable location services in the eligible market, then find and claim the offer.</p></details>
    <details><summary>Is the reward a sandwich or nuggets?</summary><p>The exact reward item for this promotion remains unconfirmed in our guide. Check the item in your app reward. Separate Timberwolves promotions may offer different items.</p></details>
    <details><summary>Where can I redeem it?</summary><p>At participating Twin Cities or St. Cloud, Minnesota restaurants. Check your app reward for the restaurant’s eligibility and opening hours.</p></details>
    <details><summary>Who qualifies?</summary><p>The promotion is for qualifying 2026–27 Timberwolves home games through June 30, 2027, including playoffs if applicable. Location services must be enabled. Limit one offer per person, while supplies last.</p></details>
    <details><summary>What if I miss the claim deadline?</summary><p>Claiming and redeeming have separate deadlines. Opening the app after 10:30 a.m. may be too late to claim, even though an already-claimed reward can be redeemed until 9 p.m.</p></details>
    <details><summary>Why might the reward be missing?</summary><p>Check that you are signed in, in the eligible market, and have location services enabled. If the reward still does not appear, check the official offer and ask Chick-fil-A support. Our tracker detects game events; it cannot see your account or guarantee reward availability.</p></details>
    <details><summary>Do Sunday or overtime count?</summary><p>The supplied terms do not explain Sunday handling or overtime eligibility. Do not assume a Saturday-night trigger can be redeemed on Sunday or that overtime counts. Follow the app’s actual reward and expiration. Our fourth-quarter tracker does not count overtime until eligibility is confirmed.</p></details>
   </div>
   <h2>What the labels mean</h2>
   <p><strong>Active:</strong> a qualifying trigger was detected for the published reward day; individual eligibility is determined by the app. After 10:30 a.m., only already-claimed rewards may remain redeemable.</p>
   <p><strong>Active tomorrow:</strong> today’s game produced a qualifying trigger. Plan to claim tomorrow before 10:30 a.m.</p>
   <p><strong>Not active:</strong> no qualifying trigger was found, the window ended, or availability could not be confirmed. Read any confirmation note.</p>
   <h2>Sources</h2>
   <p><a href="https://www.nba.com/timberwolves/cfa">Official Timberwolves promotion</a> · <a href="https://www.chick-fil-a.com/customer-support/events-and-promotions">Chick-fil-A promotion support</a></p>
   <p>The 2026–27 claim terms were transcribed from the official promotion by the site owner. The reward’s exact item remains unconfirmed.</p>
   <a className="back" href="/">Back to all deals</a>
  </article>
 </main>;
}
