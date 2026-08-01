export const tools = [
    // ── Xodimlar ──────────────────────────────────
    {
      name: "get_employees",
      description: "Xodimlar ro'yxatini oladi. Ism bo'yicha qidiruv va bo'lim filtri mavjud.",
      input_schema: {
        type: "object" as const,
        properties: {
          search:       { type: "string", description: "Ism bo'yicha qidiruv" },
          departmentId: { type: "string", description: "Bo'lim ID" },
          page:         { type: "number" },
          limit:        { type: "number" },
        },
      },
    },
    {
      name: "get_employee",
      description: "Bitta xodimning to'liq ma'lumotlarini oladi.",
      input_schema: {
        type: "object" as const,
        properties: {
          id: { type: "string", description: "Xodim ID" },
        },
        required: ["id"],
      },
    },
  
    // ── Davomat ───────────────────────────────────
    {
      name: "get_attendance_daily",
      description: "Kunlik davomat — bugun yoki berilgan sana uchun barcha xodimlar holati.",
      input_schema: {
        type: "object" as const,
        properties: {
          date:         { type: "string", description: "YYYY-MM-DD format, bo'sh qolsa bugun" },
          departmentId: { type: "string" },
        },
      },
    },
    {
      name: "get_attendance_employee",
      description: "Bitta xodimning oylik davomat tarixi — keldi/kelmadi/kechikdi.",
      input_schema: {
        type: "object" as const,
        properties: {
          employeeId: { type: "string" },
          month:      { type: "number", description: "1-12" },
          year:       { type: "number" },
        },
        required: ["employeeId"],
      },
    },
  
    // ── Jadval (o'qish) ───────────────────────────
    {
      name: "get_schedule_monthly",
      description: "Oylik shift jadvali — barcha xodimlar uchun. Jadval tuzishdan AVVAL chaqir.",
      input_schema: {
        type: "object" as const,
        properties: {
          month:        { type: "number" },
          year:         { type: "number" },
          departmentId: { type: "string" },
        },
      },
    },
    {
      name: "get_schedule_employee",
      description: "Bitta xodimning shift jadvali.",
      input_schema: {
        type: "object" as const,
        properties: {
          employeeId: { type: "string" },
          month:      { type: "number" },
          year:       { type: "number" },
        },
        required: ["employeeId"],
      },
    },
  
    // ── Shiftlar ──────────────────────────────────
    {
      name: "get_shifts",
      description: "Mavjud shift turlarini oladi. Jadval tuzishdan AVVAL chaqirib ID larni bil.",
      input_schema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "create_shift",
      description: "Yangi shift yaratadi. Faqat get_shifts da kerakli vaqt topilmasa ishlat. SUPER_ADMIN uchun hospitalId majburiy — avval get_departments dan oling.",
      input_schema: {
        type: "object" as const,
        properties: {
          name:         { type: "string", description: "Masalan: Kunduzgi 08:00-20:00" },
          type:         { type: "string", enum: ["DAYTIME", "NIGHTTIME", "CUSTOM"] },
          startTime:    { type: "string", description: "HH:MM format, masalan: 08:00" },
          endTime:      { type: "string", description: "HH:MM format, masalan: 20:00" },
          isOvernight:  { type: "boolean", description: "Tungi (keyingi kun tugasa) — true" },
          durationH:    { type: "number", description: "Soat davomiyligi" },
          graceMinutes: { type: "number", description: "Kechikish uchun ruxsat daqiqalar, odatda 15" },
          lunchStart:   { type: "string", description: "Tushlik boshi HH:MM, ixtiyoriy" },
          lunchEnd:     { type: "string", description: "Tushlik oxiri HH:MM, ixtiyoriy" },
          hospitalId:   { type: "string", description: "Kasalxona ID si — SUPER_ADMIN uchun majburiy. get_departments orqali oling." }, // ← qo'shildi
        },
        required: ["name", "type", "startTime", "endTime", "durationH"],
      },
    },
  
    // ── Jadval (yozish) ───────────────────────────
    {
      name: "create_schedule_employee",
      description: `Bitta xodim uchun jadval yozadi.
  Har xodim uchun ALOHIDA chaqir.
  entries — kunlar ro'yxati: har kun uchun date (YYYY-MM-DD), status (WORKING yoki DAY_OFF), shiftId (WORKING bo'lsa majburiy).
  Shanba/Yakshanba ham WORKING bo'lishi mumkin — xodim ishlasa shunday belgilash kerak.`,
      input_schema: {
        type: "object" as const,
        properties: {
          employeeId: { type: "string", description: "Xodim ID" },
          entries: {
            type: "array",
            description: "Kunlar ro'yxati",
            items: {
              type: "object",
              properties: {
                date:    { type: "string", description: "YYYY-MM-DD" },
                status:  { type: "string", enum: ["WORKING", "DAY_OFF"] },
                shiftId: { type: "string", description: "Shift ID, faqat WORKING uchun" },
              },
              required: ["date", "status"],
            },
          },
        },
        required: ["employeeId", "entries"],
      },
    },
    {
      name: "create_schedule_bulk",
      description: `Bir xil jadval bo'lgan KO'P xodim uchun bir vaqtda jadval yozadi.
  Faqat employeeIds dagi BARCHA xodimlar uchun entries AYNAN BIR XIL bo'lganda ishlat.
  Har xodim uchun vaqt yoki kun farq qilsa — create_schedule_employee ni alohida chaqir.`,
      input_schema: {
        type: "object" as const,
        properties: {
          employeeIds: {
            type: "array",
            items: { type: "string" },
            description: "Xodimlar ID lari ro'yxati",
          },
          entries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date:    { type: "string", description: "YYYY-MM-DD" },
                status:  { type: "string", enum: ["WORKING", "DAY_OFF"] },
                shiftId: { type: "string", description: "Shift ID" },
              },
              required: ["date", "status"],
            },
          },
        },
        required: ["employeeIds", "entries"],
      },
    },
  
    // ── Maosh ─────────────────────────────────────
    {
      name: "get_payroll_list",
      description: "Barcha xodimlarning oylik maosh hisobi.",
      input_schema: {
        type: "object" as const,
        properties: {
          month:        { type: "number" },
          year:         { type: "number" },
          departmentId: { type: "string" },
        },
      },
    },
    {
      name: "get_payroll_employee",
      description: "Bitta xodimning maosh ma'lumoti.",
      input_schema: {
        type: "object" as const,
        properties: {
          employeeId: { type: "string" },
          month:      { type: "number" },
          year:       { type: "number" },
        },
        required: ["employeeId"],
      },
    },
    {
      name: "preview_payroll",
      description: "Xodimning maoshini hisoblash preview — hali saqlanmagan holda.",
      input_schema: {
        type: "object" as const,
        properties: {
          employeeId: { type: "string" },
          month:      { type: "number" },
          year:       { type: "number" },
        },
        required: ["employeeId"],
      },
    },
  
    // ── Dashboard ─────────────────────────────────
    {
      name: "get_dashboard_overview",
      description: "Dashboard umumiy ko'rinish — bugungi davomat, kechikishlar, statistika.",
      input_schema: {
        type: "object" as const,
        properties: {
          date: { type: "string", description: "YYYY-MM-DD, bo'sh qolsa bugun" },
        },
      },
    },
    {
      name: "get_dashboard_analytics",
      description: "Oylik analytics — xodimlar samaradorligi, davomat foizi.",
      input_schema: {
        type: "object" as const,
        properties: {
          month: { type: "number" },
          year:  { type: "number" },
        },
      },
    },
  
    // ── Ta'til ────────────────────────────────────
    {
      name: "get_leave_requests",
      description: "Ta'til so'rovlari ro'yxati — PENDING, APPROVED, REJECTED filtrlash mumkin.",
      input_schema: {
        type: "object" as const,
        properties: {
          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
          page:   { type: "number" },
          limit:  { type: "number" },
        },
      },
    },
    {
      name: "get_employees_on_leave",
      description: "Hozir yoki berilgan sanada tatilda bo'lgan xodimlar — turi, sababi, muddati bilan.",
      input_schema: {
        type: "object" as const,
        properties: {
          date:         { type: "string", description: "YYYY-MM-DD, bo'sh qolsa bugun" },
          departmentId: { type: "string", description: "Bo'lim bo'yicha filter (ixtiyoriy)" },
        },
      },
    },
  
    // ── Bo'limlar ─────────────────────────────────
    {
      name: "get_departments",
      description: "Barcha bo'limlar ro'yxati.",
      input_schema: {
        type: "object" as const,
        properties: {},
      },
    },
  ];