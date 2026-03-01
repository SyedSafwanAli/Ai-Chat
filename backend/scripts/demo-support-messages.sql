-- =============================================================================
-- Demo Support Messages — Super Admin Support Center Preview
-- Import this AFTER database_complete.sql + migrate-v4.sql + migrate-v5.sql
--
-- Creates realistic support conversations for 5 demo businesses.
-- Timestamps are spread over last 7 days for realism.
-- =============================================================================

-- Clear any existing support messages first (optional — comment out if you want to keep existing)
-- TRUNCATE TABLE support_messages;

INSERT INTO support_messages (user_id, message, sender, created_at) VALUES

-- ─────────────────────────────────────────────────────────────────────────────
-- Thread 1: PizzaRun Karachi (user_id=2) — Asking about WhatsApp credits issue
-- ─────────────────────────────────────────────────────────────────────────────
(2, 'Assalam o Alaikum, mera WhatsApp bot kaam karna band ho gaya hai. Customers ko reply nahi ja rha.', 'user',  DATE_SUB(NOW(), INTERVAL 6 DAY)),
(2, 'Aapka credit balance zero ho gaya tha. Humne 1000 credits add kar diye hain aapke account mein. Ab check karein.', 'admin', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 30 MINUTE),
(2, 'Shukria! Ab bot theek kaam kar raha hai. Ek masla aur hai — bot greeting message galat dikh raha hai "Good morning" late raat ko bhi bol raha hai.', 'user', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 'Yeh Business Settings → General Info mein Working Hours set karke fix ho jata hai. Apni shift timings wahan enter karein, bot automatically adjust ho jayega.', 'admin', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 45 MINUTE),
(2, 'Perfect! Ho gaya. Boht acha feature hai yeh. Shukriya support ki.', 'user', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR),

-- ─────────────────────────────────────────────────────────────────────────────
-- Thread 2: Sunrise Academy (user_id=4) — Package upgrade query
-- ─────────────────────────────────────────────────────────────────────────────
(4, 'Hi, we want to upgrade from Basic to Pro plan. How do we proceed?', 'user', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(4, 'Hello! We can upgrade your plan from our end. Pro gives you 10,000 credits/month vs 2,000 on Basic. Should I upgrade you now?', 'admin', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 1 HOUR),
(4, 'Yes please! We have been getting a lot of parent inquiries and running out of credits by mid-month.', 'user', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 2 HOUR),
(4, 'Done! Your account has been upgraded to Pro. Package valid till end of next month. You now have 10,000 credits available. Please restart your WhatsApp session if needed.', 'admin', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 2 HOUR + INTERVAL 15 MINUTE),
(4, 'Thank you so much! Really appreciate the quick support.', 'user', DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- ─────────────────────────────────────────────────────────────────────────────
-- Thread 3: Bloom Boutique (user_id=6) — Bot not answering properly
-- ─────────────────────────────────────────────────────────────────────────────
(6, 'Mera bot customers ke price questions ka jawab nahi de raha. Woh sirf "please contact us" bol deta hai.', 'user', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(6, 'Bot apni services ki pricing tab dikhata hai jab Services tab mein prices enter kiye hon. Kya aapne Business Settings → Services mein apni items add ki hain?', 'admin', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 20 MINUTE),
(6, 'Nahi, woh section khali tha. Abhi dress prices add kar rahi hun.', 'user', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, 'Boht acha! Services add karne ke baad bot automatically unhe use karega customer queries mein. FAQs bhi add karein — woh bot ko aur smart banata hai.', 'admin', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 30 MINUTE),
(6, 'Services add kar diye. Test kiya — ab perfectly kaam kar raha hai! Customers khush hain.', 'user', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 'Zabardast! Agar koi aur masla aaye toh zaroor batayein. :)', 'admin', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 10 MINUTE),

-- ─────────────────────────────────────────────────────────────────────────────
-- Thread 4: TechFix Lahore (user_id=7) — WhatsApp connection problem
-- ─────────────────────────────────────────────────────────────────────────────
(7, 'Our WhatsApp integration stopped working after we changed our phone number on Meta. How to reconnect?', 'user', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(7, 'You need to update your Phone Number ID and Access Token in Business Settings → WhatsApp tab. The old credentials become invalid when the number changes on Meta.', 'admin', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 40 MINUTE),
(7, 'We updated the credentials but still getting an error "token invalid" in the dashboard.', 'user', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(7, 'Please make sure you are using a Permanent Access Token (not a temporary 24h one). Go to Meta for Developers → your app → WhatsApp → API Setup → generate permanent token. Then update it in the dashboard.', 'admin', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 1 HOUR),
(7, 'That was the issue! Permanent token worked perfectly. We are live again. Thank you!', 'user', DATE_SUB(NOW(), INTERVAL 18 HOUR)),

-- ─────────────────────────────────────────────────────────────────────────────
-- Thread 5: Golden Bakers (user_id=11) — New account, asking how to start
-- ─────────────────────────────────────────────────────────────────────────────
(11, 'Assalam o Alaikum! Hum naye hain yahan. Bot setup kaise karte hain step by step?', 'user', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(11, 'Walaikum Assalam! Khush amdeed Golden Bakers! Setup ke liye yeh steps follow karein:\n1. Business Settings → General Info → apna business fill karein\n2. Services tab → apni bakery items add karein (naam, price)\n3. FAQs tab → common customer questions add karein\n4. Lead Keywords → "order", "cake", "delivery" jaise words add karein\n5. WhatsApp tab → Meta se Phone Number ID aur Token enter karein\n\nKoi step mein problem ho toh batayein!', 'admin', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(11, 'Boht boht shukriya! Ek cheez samajh nahi aayi — Lead Keywords kya hoti hain exactly?', 'user', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(11, 'Lead Keywords woh words hain jo indicate karte hain ke customer kharidna chahta hai. Jab customer in words use kare toh bot us conversation ko "Hot Lead" mark kar deta hai. Misal ke tor par: "order", "price", "delivery", "custom cake", "khareedna hai" — inhe add karein. Aap Leads page mein ye sab dekh sakenge.', 'admin', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(11, 'Wah! Samajh aa gaya. Shuru karte hain. Boht useful system hai yeh!', 'user', DATE_SUB(NOW(), INTERVAL 1 HOUR));
