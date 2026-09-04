import { NextRequest, NextResponse } from "next/server";

const TAX_CODE_REGEX = /^\d{10}(-\d{3})?$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taxCode: string }> },
) {
  const { taxCode: rawTaxCode } = await params;
  const taxCode = rawTaxCode?.trim();

  if (!taxCode || !TAX_CODE_REGEX.test(taxCode)) {
    return NextResponse.json(
      { code: "01", desc: "Mã số thuế không hợp lệ", data: null },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://api.vietqr.io/v2/business/${taxCode}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          code: "02",
          desc: `VietQR trả về lỗi HTTP ${response.status}`,
          data: null,
        },
        { status: 502 },
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        code: "03",
        desc: "Không thể kết nối tới dịch vụ tra cứu mã số thuế",
        data: null,
      },
      { status: 502 },
    );
  }
}
