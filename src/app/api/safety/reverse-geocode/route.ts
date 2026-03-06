import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get("lat");
        const lon = searchParams.get("lon");

        if (!lat || !lon) {
            return NextResponse.json(
                { success: false, error: "Lat/Lon required" },
                { status: 400 }
            );
        }

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
            lat
        )}&lon=${encodeURIComponent(lon)}&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Metalix24 Safety Center",
                "Accept-Language": "ar",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: "Geocode failed" },
                { status: 502 }
            );
        }

        const data = await response.json();
        const address = data.address || {};
        const governorate = address.state || address.region || "";
        const city = address.city || address.town || address.village || address.county || "";
        const street = address.road || address.neighbourhood || address.suburb || "";
        const houseNumber = address.house_number ? ` ${address.house_number}` : "";
        const formattedAddress = [governorate, city, `${street}${houseNumber}`]
            .filter((part) => part && part.trim().length > 0)
            .join("، ");

        return NextResponse.json({
            success: true,
            governorate,
            city,
            street: `${street}${houseNumber}`.trim(),
            formattedAddress,
        });
    } catch (error) {
        console.error("Reverse geocode error:", error);
        return NextResponse.json(
            { success: false, error: "Reverse geocode error" },
            { status: 500 }
        );
    }
}
