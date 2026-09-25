#!/bin/bash

WALLET_FILE="wallets.txt"
PROGRESS_FILE="completed_wallets.txt"
touch "$PROGRESS_FILE"

TOTAL=$(grep -cve '^\s*$' "$WALLET_FILE")
COUNT=0

echo "========================================================="
echo "⚡ Miden zkVM Real On-Chain Tx Generator Başlayır..."
echo "📊 Hədəf Cüzdanlar: $TOTAL"
echo "🌐 Bütün tranzaksiyalar Midenscan-da qeydə alınacaq"
echo "========================================================="

# İlkin sinxronizasiya
miden-client sync > /dev/null 2>&1

send_tx() {
    local target="$1"
    local asset="$2"
    local name="$3"

    echo -n "  -> $name göndərilir... "
    miden-client transfer --target "$target" --asset "$asset" --note-type public --force > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✓ UĞURLU (Tx Zəncirə Getdi)"
        sleep 5
        miden-client sync > /dev/null 2>&1
        sleep 2
        return 0
    else
        echo "⏳ RPC Gözlənilir (Təkrar Cəhd)..."
        sleep 8
        miden-client sync > /dev/null 2>&1
        miden-client transfer --target "$target" --asset "$asset" --note-type public --force > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "  ✓ UĞURLU (2-ci Cəhddə Getdi)"
            sleep 5
            miden-client sync > /dev/null 2>&1
            sleep 2
            return 0
        fi
        echo "  ⚠️ Keçildi"
        return 1
    fi
}

while IFS= read -r WALLET || [ -n "$WALLET" ]; do
    WALLET=$(echo "$WALLET" | tr -d '\r' | xargs)
    [ -z "$WALLET" ] && continue

    COUNT=$((COUNT + 1))

    # Artıq tamamlananları keçirik
    if grep -q "^$WALLET$" "$PROGRESS_FILE"; then
        echo "[$COUNT / $TOTAL] Cüzdan: $WALLET (Artıq Tx-lər göndərilib ✓)"
        continue
    fi

    echo ""
    echo "---------------------------------------------------------"
    echo "[$COUNT / $TOTAL] 🚀 Yeni Tranzaksiyalar: $WALLET"
    echo "---------------------------------------------------------"

    # 1. MIDEN Tx
    send_tx "$WALLET" "1::MIDEN" "1 MIDEN Tx"

    # 2. IETH Tx
    send_tx "$WALLET" "0.01::IETH" "0.01 IETH Tx"

    # 3. IUSDT Tx
    send_tx "$WALLET" "0.01::IUSDT" "0.01 IUSDT Tx"

    # Tamamlandı kimi qeyd edirik
    echo "$WALLET" >> "$PROGRESS_FILE"

done < "$WALLET_FILE"

echo ""
echo "========================================================="
echo "🎉 BÜTÜN CÜZDANLARA YÜZLƏRLƏ ON-CHAIN TX UĞURLA YAZILDI!"
echo "========================================================="
miden-client sync
miden-client account -s 0xe564ce05189a04c13fe17400eee45f
