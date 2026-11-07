const storeData = {
    settings: {
        announcementBarText: "FREE SHIPPING ON ALL ORDERS",
        storeName: "KRM Brite",
        currencySymbol: "Rs.",
        currencyCode: "INR"
    },
    navigation: [
        { name: "Home", link: "./" },
        { name: "Products", link: "./#products" },
        { name: "Contact", link: "#contact" },
        { name: '<div style="background:#25D366; color:white; padding:6px 14px; border-radius:50px; font-weight:600; display:inline-flex; align-items:center; gap:6px; font-size:14px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> WhatsApp Enquiry</div>', link: "https://wa.me/917094328711" }
    ],
    hero: {
        slides: [
            "HI/Main.png"
            /* PREVIOUS HERO SLIDER SLIDES (Uncomment to restore slideshow):
            "HI/Rc1.avif",
            "HI/Rc2.avif",
            "HI/Rc3.avif",
            "HI/Rc4.avif",
            "HI/Rc5.avif",
            "HI/Rc6.webp",
            "HI/Rc7.webp",
            "HI/Rc8.webp"
            */
        ]
    },
    products: [
        {
            id: "sample-product",
            hidden: false,
            title: "500ml Trial Liquid Detergent + Fabric Conditioner (Direct Use)",
            description: "Try our 500ml Trial Liquid Detergent + Fabric Conditioner (Direct Use) for soft, fresh, and beautifully scented clothes. Once you experience the premium cleaning and freshness, switch to our 1 Kg Detergent + Fabric Conditioner Concentrate — a powerful and economical solution that gives you more washes with long-lasting fragrance. 💙\n\"Clean Better • Save More • Feel the Freshness\"",
            price: 99.00,
            compareAtPrice: 199.00,
            rating: 4.9,
            reviewsCount: 185,
            badges: ["Sale"],
            boughtText: "1.8K+ Bought in Past Week",
            images: [
                "Product/Sample/S1.avif",
                "Product/Sample/S2.avif",
                "Product/Sample/S3.avif",
                "Product/Sample/S4.avif",
                "Product/Sample/S5.avif",
                "Product/Sample/S6.avif"
            ],
            aboutHtml: `<div style="margin-top:20px;">
                            <h3 style="margin-bottom:25px; font-size:1.8rem; color:#0f172a; text-align:center;">Why Choose <span style="color:#2563eb;">KRM Brite?</span></h3>
                            <div style="display:grid; grid-template-columns:1fr; gap:15px;">
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">💧</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:3px;">Detergent + Fabric Conditioner ( 2 in 1 )</strong><span style="color:#2563eb; font-size:14px; font-weight:600; display:block; margin-bottom:5px;">One Wash, Two Benefits</span><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Powerful detergent removes dirt and stains while fabric conditioner keeps clothes soft, smooth and fresh with a long-lasting fragrance</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">👕</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Safe for All Fabrics</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Designed to be gentle yet effective. Its unique formulation ensures that even the most sensitive fabrics like silk and wool remain soft, fresh, and completely undamaged.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#faf5ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#a855f7; flex-shrink:0;">💜</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Lavender Freshness that Lasts</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Infuses your clothes with a long-lasting enchanting lavender fragrance that keeps your clothes smelling incredibly fresh for days.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fff7ed; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#f97316; flex-shrink:0;">🌿</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Natural Cleaning Power</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Formulated with natural, non-toxic ingredients that are tough on stains. 100% free from harsh chemicals—making it completely safe for your family and pets.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">⚙️</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Universal Machine Compatibility</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Whether you use a top load, front load machine, or prefer hand washing, it delivers consistent, powerful cleaning performance across the board.</p></div>
                                </div>
                            </div>
                        </div>`
        },
        {
            id: "detergent-fabric-conditioner",
            title: "Detergent + Fabric Conditioner Concentrate 1kg Makes 5 Litres",
            description: "Experience premium hospitality-grade cleaning. Our 2-in-1 ultra-concentrated formula combines powerful detergent with fabric conditioner, allowing you to make 5 litres from a single pack.\n\nDetergent + Fabric Conditioner ( 2 in 1 )\nOne Wash, Two Benefits\nPowerful detergent removes dirt and stains while fabric conditioner keeps clothes soft, smooth and fresh with a long-lasting fragrance",
            price: 499.00,
            compareAtPrice: 599.00,
            rating: 4.9,
            reviewsCount: 148,
            badges: ["Sale"],
            boughtText: "900+ Bought in Past Week",
            videoUrl: "https://youtu.be/wzkIU4E5kwc?si=1czx_b3ezZrfyplZ",
            images: [
                "Product/Liquid Detergent/D1.avif",
                "Product/Liquid Detergent/D2.avif",
                "Product/Liquid Detergent/D3.avif",
                "Product/Liquid Detergent/D4.avif",
                "Product/Liquid Detergent/D5.avif",
                "Product/Liquid Detergent/D6.avif",
                "Product/Liquid Detergent/D7.avif",
                "Product/Liquid Detergent/D8.avif",
                "Product/Liquid Detergent/D9.avif",
                "Product/Liquid Detergent/D10.avif"
            ],
            aboutHtml: `<div style="margin-top:20px;">
                            <h3 style="margin-bottom:25px; font-size:1.8rem; color:#0f172a; text-align:center;">Why Choose <span style="color:#2563eb;">KRM Brite?</span></h3>
                            <div style="display:grid; grid-template-columns:1fr; gap:15px;">
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; transition:0.3s; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">💧</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Ultra-Concentrated Formula</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">KRM Brite is ultra-concentrated, offering up to 5 litres of detergent from just 1 kg. Perfect for households looking for maximum efficiency without compromising on cleaning power.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; transition:0.3s; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">👕</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Safe for All Fabrics</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Designed to be gentle yet effective. Its unique formulation ensures that even the most sensitive fabrics like silk and wool remain soft, fresh, and completely undamaged.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; transition:0.3s; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#faf5ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#a855f7; flex-shrink:0;">💜</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Lavender Freshness that Lasts</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Infuses your clothes with a long-lasting enchanting lavender fragrance that keeps your clothes smelling incredibly fresh for days.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; transition:0.3s; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fff7ed; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#f97316; flex-shrink:0;">🌿</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Natural Cleaning Power</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Formulated with natural, non-toxic ingredients that are tough on stains. 100% free from harsh chemicals—making it completely safe for your family and pets.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; transition:0.3s; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">⚙️</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Universal Machine Compatibility</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Whether you use a top load, front load machine, or prefer hand washing, it delivers consistent, powerful cleaning performance across the board.</p></div>
                                </div>
                            </div>
                        </div>`
        },
        {
            id: "dishwash-liquid-concentrate",
            hidden: true,
            title: "Dishwash Liquid concentrate 1kg Makes 5 Litres ( Lemon Fragrance)",
            description: "KRM Brite Dishwash Liquid Concentrate 1kg Makes 5 Litres and powerful grease-cutting formula designed to remove tough oil stains and food residues while giving your utensils a sparkling shine. Its fresh lemon fragrance keeps your kitchen smelling clean and refreshing. Gentle on hands and tough on grease, it delivers effective cleaning with every wash.",
            price: 499.00,
            compareAtPrice: 599.00,
            rating: 4.9,
            reviewsCount: 142,
            badges: ["Sale"],
            boughtText: "1.4K+ Bought in Past Week",
            images: [
                "Product/Dishwash/Dish1.webp",
                "Product/Dishwash/Dish2.webp",
                "Product/Dishwash/Dish3.webp",
                "Product/Dishwash/Dish4.webp",
                "Product/Dishwash/Dish5.webp",
                "Product/Dishwash/Dish6.webp",
                "Product/Dishwash/Dish7.webp",
                "Product/Dishwash/Dish8.webp",
                "Product/Dishwash/Dish9.webp"
            ],
            aboutHtml: `<div style="margin-top:20px;">
                            <h3 style="margin-bottom:25px; font-size:1.8rem; color:#0f172a; text-align:center;">Why Choose <span style="color:#2563eb;">KRM Brite?</span></h3>
                            <div style="display:grid; grid-template-columns:1fr; gap:15px;">
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">💧</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">1kg Makes 5 Litres</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Highly concentrated formula that gives 5 litres of powerful dishwash liquid by adding water.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">🌿</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">No Harsh Chemicals</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Gentle cleaning formula designed to protect your hands while delivering effective cleaning.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fefce8; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#eab308; flex-shrink:0;">🍋</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Refreshing Lemon Fragrance</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Leaves utensils with a fresh lemon aroma after every wash.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fff7ed; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#f97316; flex-shrink:0;">🍽️</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Powerful Grease Cleaner</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Easily removes tough oil, grease, and food stains from plates and utensils.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">✨</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Sparkling Shine Formula</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Gives a bright, spotless shine to stainless steel, glass, and kitchen utensils.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#faf5ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#a855f7; flex-shrink:0;">🌸</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Long-Lasting Freshness</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Keeps your kitchen smelling clean and fresh after every wash.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">💰</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Economical & Effective Solution</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Concentrated formula saves money while providing premium cleaning performance.</p></div>
                                </div>
                            </div>
                        </div>`
        },
        {
            id: "toilet-cleaner-concentrate",
            hidden: true,
            title: "Toilet Cleaner Concentrate 1kg makes 5 Litres ( Ocean Fresh)",
            description: "KRM Brite Toilet Cleaner Concentrate 1kg is a powerful cleaning solution designed to remove tough stains, germs, and bad odours from toilets. Just add water to make 5 litres of effective toilet cleaner with a refreshing fragrance and sparkling clean results. Perfect for homes, offices, and commercial spaces.",
            price: 499.00,
            compareAtPrice: 599.00,
            rating: 4.9,
            reviewsCount: 138,
            badges: ["Sale"],
            boughtText: "1.2K+ Bought in Past Week",
            images: [
                "Product/Toilet Cleaner/T1.webp",
                "Product/Toilet Cleaner/T2.webp",
                "Product/Toilet Cleaner/T3.webp",
                "Product/Toilet Cleaner/T4.webp",
                "Product/Toilet Cleaner/T5.webp",
                "Product/Toilet Cleaner/T6.webp",
                "Product/Toilet Cleaner/T7.webp",
                "Product/Toilet Cleaner/T8.webp",
                "Product/Toilet Cleaner/T9.webp",
                "Product/Toilet Cleaner/T10.webp"
            ],
            aboutHtml: `<div style="margin-top:20px;">
                            <h3 style="margin-bottom:25px; font-size:1.8rem; color:#0f172a; text-align:center;">Why Choose <span style="color:#2563eb;">KRM Brite?</span></h3>
                            <div style="display:grid; grid-template-columns:1fr; gap:15px;">
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">💧</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">1kg Makes 5 Litres</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Highly concentrated formula that gives more value with easy dilution.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fff1f2; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#f43f5e; flex-shrink:0;">💥</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Powerful Stain Removal</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Effectively removes tough stains, dirt, and toilet marks.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">🛡️</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Advanced Germ Protection</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Helps maintain a hygienic and fresh toilet environment.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#e0f2fe; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#0284c7; flex-shrink:0;">🌊</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Long-Lasting Fresh Fragrance</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Leaves your bathroom smelling clean and refreshing.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">🌿</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">No Harsh Chemicals</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Gentle cleaning formula designed for regular use.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">✨</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Deep Cleaning Action</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Reaches difficult areas and provides a sparkling clean finish.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fefce8; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#eab308; flex-shrink:0;">💰</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Cost-Effective Solution</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Ideal for homes, offices, hotels, and commercial cleaning needs.</p></div>
                                </div>
                            </div>
                        </div>`
        },
        {
            id: "handwash-liquid-concentrate",
            hidden: true,
            title: "Handwash liquid Concentrate 1kg Makes 5 Litres ( French Rose)",
            description: "KRM Brite Handwash Liquid Concentrate 1Kg Experience rich foam, effective germ protection, and gentle care for your hands. Just 1Kg concentrate makes up to 5 Litres of premium handwash liquid by adding water. Enriched with a refreshing fragrance, it keeps hands clean, soft, and fresh with every wash.",
            price: 499.00,
            compareAtPrice: 599.00,
            rating: 4.9,
            reviewsCount: 156,
            badges: ["Sale"],
            boughtText: "1.5K+ Bought in Past Week",
            images: [
                "Product/Handwash/H1.webp",
                "Product/Handwash/H2.webp",
                "Product/Handwash/H3.webp",
                "Product/Handwash/H4.webp",
                "Product/Handwash/H5.webp",
                "Product/Handwash/H6.webp",
                "Product/Handwash/H7.webp",
                "Product/Handwash/H8.webp",
                "Product/Handwash/H9.webp",
                "Product/Handwash/H10.webp"
            ],
            aboutHtml: `<div style="margin-top:20px;">
                            <h3 style="margin-bottom:25px; font-size:1.8rem; color:#0f172a; text-align:center;">Why Choose <span style="color:#2563eb;">KRM Brite?</span></h3>
                            <div style="display:grid; grid-template-columns:1fr; gap:15px;">
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">💧</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">1kg Makes 5 Litres</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Just 1Kg concentrate makes up to 5 Litres of premium handwash liquid by adding 4 Litres of water.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">🛡️</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Advanced Germ Protection</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Helps remove germs and bacteria for safer, cleaner hands.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fff1f2; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#e11d48; flex-shrink:0;">🌹</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">French Rose Fresh Fragrance</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Leaves hands with a premium floral fragrance and refreshing feel.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#faf5ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#a855f7; flex-shrink:0;">🌸</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Gentle on Skin</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Mild formula helps keep hands soft and moisturised after every wash.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">✨</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Deep Cleaning Formula</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Effectively removes dirt, oil, and impurities from hands.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">🌿</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Fresh & Hygienic Care</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Provides a refreshing handwashing experience for the whole family.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#e0f2fe; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#0284c7; flex-shrink:0;">🫧</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Rich Foam Action</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Creates luxurious foam for easy and enjoyable hand cleaning.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fefce8; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#eab308; flex-shrink:0;">👨‍👩‍👧</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Daily Family Protection</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Suitable for regular use at home, office, and public spaces.</p></div>
                                </div>
                            </div>
                        </div>`
        },
        {
            id: "floor-cleaner-lemon",
            hidden: true,
            title: "Floor Cleaner Concentrate 500ml Makes 5 Litres (Italian Lime)",
            description: "Powerful streak-free Floor Cleaner Italian Lime formulation. A pure concentrate that eliminates 99.9% of bacteria securely.",
            price: 319.00,
            compareAtPrice: 399.00,
            rating: 4.9,
            reviewsCount: 146,
            badges: ["Sale"],
            boughtText: "1.5K+ Bought in Past Week",
            videoUrl: "https://youtu.be/MozQZaoh9kI?si=tBvchMBE5LwAoOlw",
            images: [
                "Product/Floor Cleaner 500ml Concentrate Lemon/FL1.avif",
                "Product/Floor Cleaner 500ml Concentrate Lemon/FL2.avif",
                "Product/Floor Cleaner 500ml Concentrate Lemon/FL3.avif",
                "Product/Floor Cleaner 500ml Concentrate Lemon/FL4.avif",
                "Product/Floor Cleaner 500ml Concentrate Lemon/FL5.avif",
                "Product/Floor Cleaner 500ml Concentrate Lemon/FL6.avif",
                "Product/Floor Cleaner 500ml Concentrate Lemon/FL7.avif",
                "Product/Floor Cleaner 500ml Concentrate Lemon/FL8.avif"
            ],
            aboutHtml: `<div style="margin-top:20px;">
                            <h3 style="margin-bottom:25px; font-size:1.8rem; color:#0f172a; text-align:center;">Why Choose <span style="color:#2563eb;">KRM Brite?</span></h3>
                            <div style="display:grid; grid-template-columns:1fr; gap:15px;">
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fefce8; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#eab308; flex-shrink:0;">🍋</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Long-Lasting Lemon Freshness</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Features a refreshing Lemon fragrance that lingers in your space long after cleaning, transforming your environment into a fragrant oasis.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fdf2f8; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#ec4899; flex-shrink:0;">🦠</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Powerful Stain and Germ Removal</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Breaks down grease and dirt effortlessly while eliminating dangerous bacteria and viruses, ensuring a healthier and sanitized environment.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">🌿</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Eco-Friendly & Safe for All Surfaces</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Made with natural ingredients. Safe for all types of floors—wood, tiles, marble, and laminate without leaving behind harsh toxic residues.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">✨</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Quick Dry Formula</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Features a rapid quick-drying formula that leaves your floors sparkling clean without any sticky residue or incredibly long wait times.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f1f5f9; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#475569; flex-shrink:0;">🏢</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Multi-Purpose Usage</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Versatile enough for both home and office use. Perfect for kitchens, bathrooms, and high-traffic areas, delivering professional-grade cleanliness.</p></div>
                                </div>
                            </div>
                        </div>`
        },
        {
            id: "floor-cleaner-french-paradise",
            hidden: true,
            title: "Floor Cleaner Concentrate 500ml Makes 5 Litres (French Paradise)",
            description: "Powerful streak-free Floor Cleaner French Paradise. A pure concentrate that eliminates 99.9% of bacteria securely.",
            price: 329.00,
            compareAtPrice: 399.00,
            rating: 4.9,
            reviewsCount: 138,
            badges: ["Sale"],
            boughtText: "1.2K+ Bought in Past Week",
            videoUrl: "https://youtu.be/nNvmBE2TtIs?si=SZUCjeXjuQpOQppk",
            images: [
                "Product/Floor Cleaner 500ml Concentrate French Paradise/FC1.avif",
                "Product/Floor Cleaner 500ml Concentrate French Paradise/FC2.avif",
                "Product/Floor Cleaner 500ml Concentrate French Paradise/FC3.avif",
                "Product/Floor Cleaner 500ml Concentrate French Paradise/FC4.avif",
                "Product/Floor Cleaner 500ml Concentrate French Paradise/FC5.avif",
                "Product/Floor Cleaner 500ml Concentrate French Paradise/FC6.avif",
                "Product/Floor Cleaner 500ml Concentrate French Paradise/FC7.avif",
                "Product/Floor Cleaner 500ml Concentrate French Paradise/FC8.avif"
            ],
            aboutHtml: `<div style="margin-top:20px;">
                            <h3 style="margin-bottom:25px; font-size:1.8rem; color:#0f172a; text-align:center;">Why Choose <span style="color:#2563eb;">KRM Brite?</span></h3>
                            <div style="display:grid; grid-template-columns:1fr; gap:15px;">
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#faf5ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#a855f7; flex-shrink:0;">🌸</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">French Paradise Freshness</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Features a breathtaking French Paradise fragrance that lingers in your space long after cleaning, transforming your environment into a fragrant oasis.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fdf2f8; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#ec4899; flex-shrink:0;">🦠</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Powerful Stain and Germ Removal</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Breaks down grease and dirt effortlessly while eliminating dangerous bacteria and viruses, ensuring a healthier and sanitized environment.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">🌿</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Eco-Friendly & Safe for All Surfaces</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Made with natural ingredients. Safe for all types of floors—wood, tiles, marble, and laminate without leaving behind harsh toxic residues.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">✨</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Quick Dry Formula</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Features a rapid quick-drying formula that leaves your floors sparkling clean without any sticky residue or incredibly long wait times.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f1f5f9; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#475569; flex-shrink:0;">🏢</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Multi-Purpose Usage</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Versatile enough for both home and office use. Perfect for kitchens, bathrooms, and high-traffic areas, delivering professional-grade cleanliness.</p></div>
                                </div>
                            </div>
                        </div>`
        },
        {
            id: "flavoured-phenyl",
            hidden: true,
            title: "Flavoured Phenyl concentrate 500ml Makes 5 Litres ( Artic Fresh )",
            description: "Premium Flavoured Phenyl concentrate. A highly potent disinfectant designed to secure a 100% hygienic environment instantly.",
            price: 299.00,
            compareAtPrice: 380.00,
            rating: 4.8,
            reviewsCount: 124,
            badges: ["Sale"],
            boughtText: "400+ Bought in Past Week",
            videoUrl: "https://youtu.be/FtHZvH8wtS0?si=IV43zWjV8RtMlOvd",
            images: [
                "Product/Flavoured Phenyl 500ml Concentrate/PH1.avif",
                "Product/Flavoured Phenyl 500ml Concentrate/PH2.avif",
                "Product/Flavoured Phenyl 500ml Concentrate/PH3.avif",
                "Product/Flavoured Phenyl 500ml Concentrate/PH5.avif",
                "Product/Flavoured Phenyl 500ml Concentrate/PH6.avif",
                "Product/Flavoured Phenyl 500ml Concentrate/PH7.avif",
                "Product/Flavoured Phenyl 500ml Concentrate/PH8.avif"
            ],
            aboutHtml: `<div style="margin-top:20px;">
                            <h3 style="margin-bottom:25px; font-size:1.8rem; color:#0f172a; text-align:center;">Why Choose <span style="color:#2563eb;">KRM Brite?</span></h3>
                            <div style="display:grid; grid-template-columns:1fr; gap:15px;">
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#e0f2fe; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#0ea5e9; flex-shrink:0;">🧊</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Arctic Fresh Clean</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Leaves your space smelling refreshingly cool. This unique scent captures the essence of crisp air, instantly creating a rejuvenating atmosphere.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fdf2f8; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#ec4899; flex-shrink:0;">🛡️</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Powerful Disinfectant</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Effectively eliminates harmful germs, bacteria, and viruses from your floors and countertops, ensuring a completely safe environment.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">🏠</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Multi-Surface Reliability</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Formulated to clean a wide range of surfaces including tiles, marble, wood, and glass effortlessly in a single application.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">⏱️</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">24 Hour Shield</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Not only refreshing but long-lasting. The crisp scent lingers and the formula continuously protects your living space for the entire day.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f1f5f9; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#475569; flex-shrink:0;">🌿</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Safe & Eco-Friendly</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Crafted with an eco-conscious formula that is insanely tough on germs but incredibly gentle on the environment around you.</p></div>
                                </div>
                            </div>
                        </div>`
        },
        {
            id: "glass-cleaner-concentrate-500ml-moroccan-breeze",
            hidden: true,
            title: "Glass Cleaner Concentrate 500ml Makes 5 Litres ( Moroccan Breeze)",
            description: "A highly concentrated formula for a streak-free finish. Enjoy the refreshing Moroccan Breeze fragrance while effectively cleaning glass and multi-surfaces.",
            price: 299.00,
            compareAtPrice: 350.00,
            rating: 4.8,
            reviewsCount: 112,
            badges: ["Sale"],
            boughtText: "300+ Bought in Past Week",
            videoUrl: "https://youtu.be/aiOF2IbbBYM?si=TKfb2nA5Y0T7MmTH",
            images: [
                "Product/Glass Cleaner/1G.avif",
                "Product/Glass Cleaner/2G.avif",
                "Product/Glass Cleaner/3G.avif",
                "Product/Glass Cleaner/4G.avif",
                "Product/Glass Cleaner/5G.avif",
                "Product/Glass Cleaner/6G.avif",
                "Product/Glass Cleaner/7G.avif",
                "Product/Glass Cleaner/8G.avif"
            ],
            aboutHtml: `<div style="margin-top:20px;">
                            <h3 style="margin-bottom:25px; font-size:1.8rem; color:#0f172a; text-align:center;">Why Choose <span style="color:#2563eb;">KRM Brite?</span></h3>
                            <div style="display:grid; grid-template-columns:1fr; gap:15px;">
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#eff6ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#3b82f6; flex-shrink:0;">💧</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Highly Concentrated Formula</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">The 500ml concentrate makes up to 5 litres of powerful cleaning solution, offering great value for money and extended use.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fefce8; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#eab308; flex-shrink:0;">✨</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Streak-Free Finish</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Designed for a streak-free shine, it effectively removes dirt, dust, fingerprints, and smudges without leaving any residue, providing crystal-clear glass and window surfaces.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#faf5ff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#a855f7; flex-shrink:0;">🌸</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Moroccan Breeze Fragrance</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Infused with a refreshing Moroccan Breeze fragrance, this cleaner leaves your home or office smelling fresh and inviting, while you enjoy the power of clean surfaces.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f1f5f9; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#475569; flex-shrink:0;">🏢</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Multi-Surface Use</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Ideal for cleaning not just glass and windows, but also mirrors, glass tables, and other reflective surfaces, ensuring versatility in your cleaning routine.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#f0fdf4; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#10b981; flex-shrink:0;">🌿</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Eco-Friendly and Safe</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">Made with environmentally friendly ingredients, KRM Brite is safe for both the user and the surroundings, with no harsh chemicals or fumes.</p></div>
                                </div>
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; display:flex; gap:15px; align-items:flex-start; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="font-size:24px; background:#fff7ed; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#f97316; flex-shrink:0;">⏱️</div>
                                    <div><strong style="color:#0f172a; font-size:16px; display:block; margin-bottom:5px;">Fast-Drying</strong><p style="color:#64748b; font-size:14px; margin:0; line-height:1.5;">The formula dries quickly, ensuring your surfaces are clean and dry in no time, perfect for both home and office use.</p></div>
                                </div>
                            </div>
                        </div>`
        }
    ],
    defaultReviews: [
        {
            productId: "detergent-fabric-conditioner",
            name: "Priya S.",
            rating: 5,
            body: "Extremely good quality detergent! Makes 5 full litres easily and the lavender fragrance lasts for days on clothes.",
            status: "approved"
        },
        {
            productId: "detergent-fabric-conditioner",
            name: "Karthik R.",
            rating: 5,
            body: "Best 2-in-1 detergent + fabric conditioner. Clothes feel super soft after wash, works great in both top & front load machines.",
            status: "approved"
        },
        {
            productId: "detergent-fabric-conditioner",
            name: "Anitha M.",
            rating: 4,
            body: "Very money saving concentrate. Removes tough stains easily and leaves a wonderful fresh scent.",
            status: "approved"
        },
        {
            productId: "detergent-fabric-conditioner",
            name: "Senthil Kumar",
            rating: 5,
            body: "Worth every rupee! 1kg concentrate makes 5 litres and lasts for a very long time.",
            status: "approved"
        },
        {
            productId: "sample-product",
            name: "Ramesh V.",
            rating: 5,
            body: "Tried the 500ml trial pack first and was amazed by the quality. Buying the full pack now!",
            status: "approved"
        },
        {
            productId: "floor-cleaner-lemon",
            name: "Meena K.",
            rating: 5,
            body: "The Italian Lime fragrance is so fresh and long-lasting! Floor shines like new.",
            status: "approved"
        },
        {
            productId: "floor-cleaner-french-paradise",
            name: "Rajeshwari N.",
            rating: 5,
            body: "French Paradise scent is heavenly! Whole house smells clean and wonderful.",
            status: "approved"
        },
        {
            productId: "flavoured-phenyl",
            name: "Saravanan T.",
            rating: 5,
            body: "Arctic fresh smell is amazing. Cleans tiles thoroughly and keeps space hygienic.",
            status: "approved"
        },
        {
            productId: "glass-cleaner-concentrate-500ml-moroccan-breeze",
            name: "Venkatesh R.",
            rating: 5,
            body: "Moroccan Breeze smells great and leaves glass windows crystal clear with zero streaks.",
            status: "approved"
        },
        {
            productId: "dishwash-liquid-concentrate",
            name: "Lakshmi N.",
            rating: 5,
            body: "Tough grease stains vanish so quickly! The lemon fragrance is wonderful and hands stay soft.",
            status: "approved"
        },
        {
            productId: "dishwash-liquid-concentrate",
            name: "Vijay Anand",
            rating: 5,
            body: "Makes 5 litres easily. Utensils shine like new, especially stainless steel vessels.",
            status: "approved"
        },
        {
            productId: "toilet-cleaner-concentrate",
            name: "Suresh P.",
            rating: 5,
            body: "Cleans tough yellow stains effortlessly! Ocean fresh smell lasts for hours. Highly recommended.",
            status: "approved"
        },
        {
            productId: "toilet-cleaner-concentrate",
            name: "Deepa Lakshmi",
            rating: 5,
            body: "Diluted 1kg to 5L and the consistency is still super thick and powerful. Super value pack!",
            status: "approved"
        },
        {
            productId: "handwash-liquid-concentrate",
            name: "Nandhini G.",
            rating: 5,
            body: "Love the French Rose fragrance! Foam is very rich and leaves hands soft and smooth.",
            status: "approved"
        },
        {
            productId: "handwash-liquid-concentrate",
            name: "Rajesh Kannan",
            rating: 5,
            body: "Making 5 litres out of 1kg concentrate is super easy. Great quality handwash for daily family use.",
            status: "approved"
        }
    ]
};
