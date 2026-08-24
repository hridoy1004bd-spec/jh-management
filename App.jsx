onChange={(e) => setF("note")(e.target.value)} />
        </Field>
        {msg && <div className="mt-3 text-sm font-medium" style={{ color: msg.startsWith("✅") ? SUCCESS : DANGER }}>{msg}</div>}
        <button onClick={submit} disabled={saving} className="jh-btn jh-font-body w-full mt-4 rounded-lg py-3 text-sm font-bold text-white flex items-center justify-center gap-2"
          style={{ background: saving ? "#93A0BD" : NAVY_SOFT }}>
          <CheckCircle2 size={16} /> {saving ? t.saving : t.submit}
        </button>
      </div>

      <div className="rounded-2xl p-5 mt-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.recentEntries}</h2>
        {loading ? <div className="text-sm" style={{ color: MUTED }}>{t.loading}</div>
          : entries.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noEntries}</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{ color: MUTED }}>
                  <th className="text-left pb-2 font-semibold">{t.date}</th>
                  <th className="text-left pb-2 font-semibold">{t.name}</th>
                  <th className="text-right pb-2 font-semibold">{t.actualSales}</th>
                  <th className="text-right pb-2 font-semibold">{t.shortPlus}</th>
                </tr></thead>
                <tbody>
                  {entries.slice(0, 10).map((e) => (
                    <tr key={e.id} className="border-t" style={{ borderColor: "#EEF0F3" }}>
                      <td className="py-2" style={{ color: NAVY }}>{e.entry_date}</td>
                      <td className="py-2" style={{ color: NAVY }}>{e.name}</td>
                      <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(e.actual_sales)}</td>
                      <td className="py-2 text-right font-semibold" style={{ color: num(e.short_plus) < 0 ? DANGER : SUCCESS }}>{fmt(e.short_plus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

/* ---------------------------- Inventory Panel ------------------------------- */
function InventoryPanel({ pin, locationId, isStore }) {
  const { t } = useLang();
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("pcs");
  const blank = { productId: "", quantity: "", totalCost: "", movementType: isStore ? "sale" : "purchase", toLocationPin: "", expiryDate: "" };
  const [form, setForm] = useState(blank);

  const load = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        supaRpc("get_location_stock", { p_pin: pin }),
        supaRpc("get_products_for_pin", { p_pin: pin }),
      ]);
      setStock(s); setProducts(p);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addNewProduct = async () => {
    if (!newProductName.trim()) return;
    setMsg("");
    try {
      const id = await supaRpc("ensure_product", { p_pin: pin, p_name: newProductName.trim(), p_unit: newProductUnit });
      setNewProductName("");
      await load();
      setForm((f) => ({ ...f, productId: id }));
    } catch (e) { setMsg(`${t.savedFail} ${e.message}`); }
  };

  const submit = async () => {
    setMsg("");
    if (!form.productId) { setMsg(t.productName); return; }
    if (num(form.quantity) <= 0) { setMsg(t.quantity); return; }
    try {
      const needsTarget = form.movementType === "transfer" || form.movementType === "ret";
      let toLoc = null;
      if (needsTarget) {
        const rows = await supaRpc("verify_location_pin", { p_pin: form.toLocationPin });
        if (!rows || rows.length === 0) { setMsg(t.wrongPin); return; }
        toLoc = rows[0].location_id;
      }
      await supaRpc("submit_stock_movement", {
        p_pin: pin,
        p_from_location: locationId,
        p_to_location: toLoc,
        p_product_id: form.productId,
        p_quantity: num(form.quantity),
        p_total_cost: num(form.totalCost),
        p_expiry_date: form.expiryDate || null,
        p_movement_type: form.movementType === "ret" ? "return" : form.movementType,
      });
      setMsg(t.savedOk);
      setForm(blank);
      load();
    } catch (e) { setMsg(`${t.savedFail} ${e.message}`); }
    setTimeout(() => setMsg(""), 6000);
  };

  return (
    <div>
      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold flex items-center gap-1.5 mb-3" style={{ color: NAVY }}>
          <Package size={16} /> {t.currentStock}
        </h2>
        {loading ? <div className="text-sm" style={{ color: MUTED }}>{t.loading}</div>
          : stock.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noStock}</div>
          : (
            <div className="flex flex-col gap-2">
              {stock.map((s) => (
                <div key={s.product_id} className="rounded-lg px-3 py-2 flex items-center justify-between" style={{ background: BG }}>
                  <div className="jh-font-display text-sm font-bold" style={{ color: NAVY }}>{s.product_name}</div>
                  <div className="text-xs font-semibold" style={{ color: MUTED }}>{fmt(s.quantity)} {s.unit}</div>
                </div>
              ))}
            </div>
          )}
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>+ {t.productName}</h2>
        <div className="grid grid-cols-2 gap-3">
          <TextInput value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder={t.productName} />
          <select className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }}
            value={newProductUnit} onChange={(e) => setNewProductUnit(e.target.value)}>
            <option value="pcs">pcs</option><option value="kg">kg</option><option value="g">g</option>
            <option value="l">liter</option><option value="box">box</option>
          </select>
        </div>
        <button onClick={addNewProduct} className="jh-btn jh-font-body w-full mt-3 rounded-lg py-2 text-xs font-bold" style={{ background: BG, color: NAVY }}>
          <Plus size={13} className="inline mr-1" /> {t.addProduct}
        </button>
      </div>

      <div className="rounded-2xl p-5" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.addProduct}</h2>
        <div className="mb-3">
          <Field label={t.productName}>
            <select className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }}
              value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}>
              <option value="">—</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label={t.movementType}>
            <select className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }}
              value={form.movementType} onChange={(e) => setForm((f) => ({ ...f, movementType: e.target.value }))}>
              {isStore ? (
                <>
                  <option value="sale">{t.sale}</option>
                  <option value="transfer">{t.transfer}</option>
                  <option value="ret">{t.ret}</option>
                  <option value="wastage">{t.wastage}</option>
                </>
              ) : (
                <>
                  <option value="purchase">{t.purchase}</option>
                  <option value="transfer">{t.transfer}</option>
                  <option value="wastage">{t.wastage}</option>
                </>
              )}
            </select>
          </Field>
          <Field label={t.quantity}><NumInput value={form.quantity} onChange={(v) => setForm((f) => ({ ...f, quantity: v }))} /></Field>
        </div>
        {!isStore && form.movementType === "purchase" && (
          <div className="mb-3"><Field label={t.costTotal}><NumInput value={form.totalCost} onChange={(v) => setForm((f) => ({ ...f, totalCost: v }))} /></Field></div>
        )}
        {(form.movementType === "transfer" || form.movementType === "ret") && (
          <div className="mb-3"><Field icon={KeyRound} label={t.toLocation}><TextInput value={form.toLocationPin} onChange={(e) => setForm((f) => ({ ...f, toLocationPin: e.target.value }))} placeholder="PIN" /></Field></div>
        )}
        <div className="mb-3"><Field icon={CalendarClock} label={t.expiryDate}><TextInput type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} /></Field></div>
        {msg && <div className="text-sm font-medium mb-3" style={{ color: msg.startsWith("✅") ? SUCCESS : DANGER }}>{msg}</div>}
        <button onClick={submit} className="jh-btn jh-font-body w-full rounded-lg py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{ background: NAVY_SOFT }}>
          <Plus size={15} /> {t.addProduct}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- Pending Approvals Panel ----------------------- */
function PendingApprovalsPanel({ pin }) {
  const { t } = useLang();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try { setRows(await supaRpc("get_pending_movements", { p_pin: pin })); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const respond = async (id, accept) => {
    try {
      await supaRpc("respond_stock_movement", { p_movement_id: id, p_pin: pin, p_accept: accept });
      load();
    } catch (e) { setMsg(e.message); }
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: CARD }}>
      <h2 className="jh-font-display text-sm font-bold flex items-center gap-1.5 mb-3" style={{ color: NAVY }}>
        <Bell size={16} /> {t.pendingApprovals}
      </h2>
      {msg && <div className="text-sm mb-3" style={{ color: DANGER }}>{msg}</div>}
      {loading ? <div className="text-sm" style={{ color: MUTED }}>{t.loading}</div>
        : rows.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noPending}</div>
        : (
          <div className="flex flex-col gap-3">
            {rows.map((m) => (
              <div key={m.id} className="rounded-xl p-3.5" style={{ background: BG }}>
                <div className="text-xs font-semibold mb-1" style={{ color: MUTED }}>{m.movement_type} · {t.qty}: {fmt(m.quantity)}</div>
                <div className="text-xs mb-3" style={{ color: MUTED }}>{m.created_at?.slice(0, 10)}</div>
                <div className="flex gap-2">
                  <button onClick={() => respond(m.id, true)} className="jh-btn flex-1 rounded-lg py-2 text-xs font-bold" style={{ background: "#E4F2EA", color: SUCCESS }}>{t.accept}</button>
                  <button onClick={() => respond(m.id, false)} className="jh-btn flex-1 rounded-lg py-2 text-xs font-bold" style={{ background: "#FBE7E4", color: DANGER }}>{t.reject}</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

/* ============================== ADMIN SCREEN ================================ */
function AdminScreen({ session, onLogout }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState("dashboard");
  const isSuperAdmin = session.profile?.role === "super_admin";
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(session.profile?.company_id || null);

  useEffect(() => {
    if (isSuperAdmin) {
      supaRpc("get_all_companies", {}, session.accessToken).then(setCompanies).catch(console.error);
    }
  }, [isSuperAdmin]);

  return (
    <div className="min-h-screen jh-font-body" dir={lang === "ar" ? "rtl" : "ltr"} style={{ background: BG }}>
      <GlobalStyle />
      <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ background: NAVY }}>
        <div className="flex items-center gap-2.5">
          <LogoBadge size={36} />
          <div>
            <div className="jh-font-display text-white text-base font-bold leading-tight">{t.tabDashboard}</div>
            <div className="text-xs" style={{ color: "#9AA5BD" }}>{isSuperAdmin ? t.allCompanies : t.company}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LangSwitcher compact />
          <button onClick={onLogout} className="jh-btn flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ color: "white", background: "rgba(255,255,255,0.12)" }}>
            <LogOut size={13} /> {t.logout}
          </button>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="px-4 pt-4 max-w-4xl mx-auto">
          <select className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3", background: CARD }}
            value={activeCompanyId || ""} onChange={(e) => setActiveCompanyId(e.target.value)}>
            <option value="">{t.allCompanies}</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-2 px-4 pt-4 max-w-4xl mx-auto flex-wrap">
        <button onClick={() => setTab("dashboard")} className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
          style={{ background: tab === "dashboard" ? NAVY_SOFT : CARD, color: tab === "dashboard" ? "white" : NAVY }}><LayoutGrid size={13} /> {t.tabDashboard}</button>
        <button onClick={() => setTab("payment")} className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
          style={{ background: tab === "payment" ? NAVY_SOFT : CARD, color: tab === "payment" ? "white" : NAVY }}><Banknote size={13} /> {t.tabPayment}</button>
        <button onClick={() => setTab("notices")} className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
          style={{ background: tab === "notices" ? NAVY_SOFT : CARD, color: tab === "notices" ? "white" : NAVY }}><Bell size={13} /> {t.tabNotices}</button>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {tab === "dashboard" && <AdminDashboardTab session={session} companyId={isSuperAdmin ? activeCompanyId : session.profile?.company_id} isSuperAdmin={isSuperAdmin} />}
        {tab === "payment" && <SubscriptionTab session={session} companyId={session.profile?.company_id} />}
        {tab === "notices" && <NoticesTab session={session} isSuperAdmin={isSuperAdmin} />}
      </div>
    </div>
  );
}

/* ---------------------------- Admin Dashboard Tab --------------------------- */
function AdminDashboardTab({ session, companyId }) {
  const { t } = useLang();
  const [locations, setLocations] = useState([]);
  const [movements, setMovements] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStoreId, setActiveStoreId] = useState(null);

  const load = async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [locs, mv, sl] = await Promise.all([
        supaRest(`locations?company_id=eq.${companyId}&select=*`, { accessToken: session.accessToken }),
        supaRest(`stock_movements?company_id=eq.${companyId}&select=*,products(name)&deleted_at=is.null&order=created_at.desc&limit=50`, { accessToken: session.accessToken }),
        supaRest(`sales_entries?company_id=eq.${companyId}&select=*&order=entry_date.desc`, { accessToken: session.accessToken }),
      ]);
      setLocations(locs); setMovements(mv); setSales(sl);
      const stores = locs.filter((l) => l.type === "store");
      if (stores.length > 0) setActiveStoreId((prev) => prev || stores[0].id);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [companyId]);

  const stores = locations.filter((l) => l.type === "store");
  const thisMonth = todayISO().slice(0, 7);
  const storeSales = sales.filter((s) => s.store_id === activeStoreId);
  const monthSales = storeSales.filter((s) => s.entry_date?.slice(0, 7) === thisMonth);

  const monthTotals = monthSales.reduce((a, s) => {
    a.cash += num(s.cash); a.mada += num(s.mada); a.visa += num(s.visa); a.master += num(s.master);
    a.hangar += num(s.hangar); a.jahez += num(s.jahez); a.actual += num(s.actual_sales);
    a.system += num(s.system_sales); a.expense += num(s.expense);
    return a;
  }, { cash: 0, mada: 0, visa: 0, master: 0, hangar: 0, jahez: 0, actual: 0, system: 0, expense: 0 });

  const totalSales = sales.reduce((a, s) => a + num(s.actual_sales), 0);
  const godownValue = movements.filter((m) => m.movement_type === "purchase").reduce((a, m) => a + num(m.total_cost), 0);

  if (!companyId) return <div className="text-sm p-6 text-center" style={{ color: MUTED }}>{t.company}</div>;
  if (loading) return <div className="text-sm p-6 text-center" style={{ color: MUTED }}>{t.loading}</div>;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3.5" style={{ background: CARD }}>
          <div className="text-xs" style={{ color: MUTED }}>{t.salesReport} ({t.company})</div>
          <div className="jh-font-display text-xl font-bold mt-0.5" style={{ color: NAVY }}>{fmt(totalSales)}</div>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: GOLD_SOFT }}>
          <div className="text-xs" style={{ color: "#8A6A17" }}>{t.godownReport}</div>
          <div className="jh-font-display text-xl font-bold mt-0.5" style={{ color: "#6B4F0E" }}>{fmt(godownValue)}</div>
        </div>
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.salesReport} — {t.store}</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          {stores.map((s) => (
            <button key={s.id} onClick={() => setActiveStoreId(s.id)} className="jh-btn text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: activeStoreId === s.id ? NAVY_SOFT : BG, color: activeStoreId === s.id ? "white" : NAVY }}>
              {s.name}
            </button>
          ))}
        </div>

        <div className="rounded-xl p-4 mb-4" style={{ background: BG }}>
          <div className="text-xs font-semibold mb-2" style={{ color: MUTED }}>{thisMonth} — মাসিক যোগফল</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>CASH: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.cash)}</span></div>
            <div>MADA: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.mada)}</span></div>
            <div>VISA: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.visa)}</span></div>
            <div>MASTER: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.master)}</span></div>
            <div>HANGAR: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.hangar)}</span></div>
            <div>JAHEZ: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.jahez)}</span></div>
            <div>{t.actualSales}: <span className="font-bold" style={{ color: SUCCESS }}>{fmt(monthTotals.actual)}</span></div>
            <div>System: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.system)}</span></div>
            <div>{t.expense}: <span className="font-bold" style={{ color: WARNING }}>{fmt(monthTotals.expense)}</span></div>
          </div>
        </div>

        {storeSales.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noEntries}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: MUTED }}>
                <th className="text-left pb-2 font-semibold">{t.date}</th>
                <th className="text-left pb-2 font-semibold">{t.name}</th>
                <th className="text-right pb-2 font-semibold">CASH</th>
                <th className="text-right pb-2 font-semibold">MADA</th>
                <th className="text-right pb-2 font-semibold">VISA</th>
                <th className="text-right pb-2 font-semibold">MASTER</th>
                <th className="text-right pb-2 font-semibold">{t.actualSales}</th>
                <th className="text-right pb-2 font-semibold">{t.shortPlus}</th>
              </tr></thead>
              <tbody>
                {storeSales.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: "#EEF0F3" }}>
                    <td className="py-2" style={{ color: NAVY }}>{s.entry_date}</td>
                    <td className="py-2" style={{ color: NAVY }}>{s.name}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(s.cash)}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(s.mada)}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(s.visa)}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(s.master)}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(s.actual_sales)}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: num(s.short_plus) < 0 ? DANGER : SUCCESS }}>{fmt(s.short_plus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.store} / {t.godown}</h2>
        <div className="flex flex-wrap gap-2">
          {locations.map((l) => (
            <div key={l.id} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: BG, color: NAVY }}>
              {l.name} ({l.type})
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.stockReport}</h2>
        {movements.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noEntries}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: MUTED }}>
                <th className="text-left pb-2 font-semibold">{t.productName}</th>
                <th className="text-left pb-2 font-semibold">{t.movementType}</th>
                <th className="text-right pb-2 font-semibold">{t.qty}</th>
                <th className="text-right pb-2 font-semibold">{t.costTotal}</th>
              </tr></thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-t" style={{ borderColor: "#EEF0F3" }}>
                    <td className="py-2" style={{ color: NAVY }}>{m.products?.name}</td>
                    <td className="py-2" style={{ color: NAVY }}>{m.movement_type} ({m.status})</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(m.quantity)}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(m.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- Subscription Tab ------------------------------ */
function SubscriptionTab({ session, companyId }) {
  const { t } = useLang();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStorePin, setNewStorePin] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try { setSubs(await supaRest(`subscriptions?company_id=eq.${companyId}&select=*,locations(name)`, { accessToken: session.accessToken })); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [companyId]);

  const copy = async (id, number) => {
    try { await navigator.clipboard.writeText(number); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch (e) {}
  };

  const addStore = async () => {
    if (!newStoreName.trim() || !newStorePin.trim()) return;
    setMsg("");
    try {
      await supaRpc("add_location", { p_type: "store", p_name: newStoreName.trim(), p_pin: newStorePin.trim() }, session.accessToken);
      setNewStoreName(""); setNewStorePin("");
      load();
    } catch (e) { setMsg(`${t.savedFail} ${e.message}`); }
  };

  const statusLabel = (s) => ({ trial: t.trialStatus, active: t.activeStatus, pending_payment: t.pendingPayment, expired: t.pendingPayment, blocked: t.blockedStatus }[s] || s);
  const statusColor = (s) => ({ trial: WARNING, active: SUCCESS, pending_payment: DANGER, expired: DANGER, blocked: DANGER }[s] || MUTED);

  return (
    <div>
      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.subscriptionTitle}</h2>
        {loading ? <div className="text-sm" style={{ color: MUTED }}>{t.loading}</div>
          : subs.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noEntries}</div>
          : (
            <div className="flex flex-col gap-2.5">
              {subs.map((s) => {
                const d = s.next_due_date ? daysUntil(s.next_due_date) : null;
                return (
                  <div key={s.id} className="rounded-xl p-3.5" style={{ background: BG }}>
                    <div className="flex items-center justify-between">
                      <div className="jh-font-display text-sm font-bold" style={{ color: NAVY }}>{s.locations?.name}</div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${statusColor(s.status)}18`, color: statusColor(s.status) }}>{statusLabel(s.status)}</span>
                    </div>
                    {s.next_due_date && (
                      <div className="text-xs mt-1" style={{ color: MUTED }}>{t.dueDate}: {s.next_due_date} {d != null && d >= 0 ? `(${d} ${t.daysLeft})` : ""}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.addStore}</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label={t.newStoreName}><TextInput value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} /></Field>
          <Field label={t.newStorePin}><TextInput value={newStorePin} onChange={(e) => setNewStorePin(e.target.value)} /></Field>
        </div>
        {msg && <div className="text-sm mb-3" style={{ color: DANGER }}>{msg}</div>}
        <button onClick={addStore} className="jh-btn jh-font-body w-full rounded-lg py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{ background: NAVY_SOFT }}>
          <Plus size={15} /> {t.addStore}
        </button>
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold flex items-center gap-1.5 mb-1" style={{ color: NAVY }}><Banknote size={16} /> {t.subscriptionTitle}</h2>
        <div className="flex flex-col gap-3 mt-3">
          {PAYMENT_METHODS.map((m) => (
            <div key={m.id} className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: BG, borderLeft: `4px solid ${m.color}` }}>
              <div>
                <div className="jh-font-display text-sm font-bold" style={{ color: NAVY }}>{m.name}</div>
                {m.number ? <div className="jh-font-display text-base font-bold mt-0.5" style={{ color: m.color }}>{m.number}</div>
                  : <div className="text-xs mt-1 font-semibold" style={{ color: MUTED }}>{t.comingSoon}</div>}
              </div>
              {m.number && (
                <button onClick={() => copy(m.id, m.number)} className="jh-btn shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: copiedId === m.id ? "#E4F2EA" : CARD, color: copiedId === m.id ? SUCCESS : NAVY, border: "1px solid #D9DCE3" }}>
                  {copiedId === m.id ? <Check size={13} /> : <Copy size={13} />} {copiedId === m.id ? t.copied : t.copyNumber}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Notices Tab ------------------------------------ */
function NoticesTab({ session, isSuperAdmin }) {
  const { t } = useLang();
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try { setNotices(await supaRest(`notices?is_active=eq.true&select=*&order=created_at.desc`, { accessToken: session.accessToken })); }
    catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!title.trim() || !message.trim()) return;
    setMsg("");
    try {
      await supaRest("notices", { method: "POST", accessToken: session.accessToken, body: { title, message, company_id: null }, prefer: "return=minimal" });
      setTitle(""); setMessage(""); load();
    } catch (e) { setMsg(`${t.savedFail} ${e.message}`); }
  };

  return (
    <div>
      {isSuperAdmin && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
          <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.postNotice}</h2>
          <div className="flex flex-col gap-3">
            <Field label={t.noticeTitleField}><TextInput value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label={t.noticeMsg}>
              <textarea className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            </Field>
          </div>
          {msg && <div className="text-sm mt-2" style={{ color: DANGER }}>{msg}</div>}
          <button onClick={post} className="jh-btn jh-font-body w-full mt-3 rounded-lg py-2.5 text-sm font-bold text-white" style={{ background: NAVY_SOFT }}>{t.submit}</button>
        </div>
      )}
      <div className="rounded-2xl p-5" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.noticesTitle}</h2>
        {notices.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noNotices}</div> : (
          <div className="flex flex-col gap-3">
            {notices.map((n) => (
              <div key={n.id} className="rounded-xl p-3.5" style={{ background: BG }}>
                <div className="jh-font-display text-sm font-bold" style={{ color: NAVY }}>{n.title}</div>
                <div className="text-xs mt-1" style={{ color: MUTED }}>{n.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================================== APP ==================================== */
export default function App() {
  const [lang, setLang] = useState("bn");
  const [mode, setMode] = useState("gate"); // gate | pin-login | company-auth
  const [locationSession, setLocationSession] = useState(null);
  const [adminSession, setAdminSession] = useState(null);
  const t = STR[lang];

  let content;
  if (locationSession) {
    content = <LocationScreen session={locationSession} onLogout={() => setLocationSession(null)} />;
  } else if (adminSession) {
    content = <AdminScreen session={adminSession} onLogout={() => setAdminSession(null)} />;
  } else if (mode === "pin-login") {
    content = <PinLoginScreen onLoggedIn={setLocationSession} onBack={() => setMode("gate")} />;
  } else if (mode === "company-auth") {
    content = <CompanyAuthScreen onLoggedIn={setAdminSession} onBack={() => setMode("gate")} />;
  } else {
    content = <EntryGate onPinMode={() => setMode("pin-login")} onCompanyMode={() => setMode("company-auth")} />;
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{content}</LangContext.Provider>;
}
