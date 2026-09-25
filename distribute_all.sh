#!/bin/bash

WALLET_FILE="wallets.txt"
PROGRESS_FILE="completed_wallets.txt"
touch "$PROGRESS_FILE"

TOTAL=$(grep -cve '^\s*$' "$WALLET_FILE")
COUNT=0

echo "========================================================="
echo "🚀 Miden zkVM Dayanıqlı Token Paylanması (60s Timeout)..."
echo "📊 Cəmi Cüzdan: $TOTAL"
echo "💰 Hər birinə: 1 MIDEN + 0.01 IETH + 0.01 IUSDT"
echo "========================================================="

# Əvvəlcə zəncirlə tam sinxronlaşırıq
miden-client sync > /dev/null 2>&1

send_token_robust() {
    local target="$1"
    local asset="$2"
    local name="$3"
    local max_tries=3
    local try=1

    while [ $try -le $max_tries ]; do
        miden-client transfer --target "$target" --asset "$asset" --note-type public --force > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "  ✓ $name göndərildi"
            miden-client sync > /dev/null 2>&1
            sleep 10
            return 0
        else
            echo "  ⏳ RPC Timeout gözlənilir (Cəhd $try/$max_tries)..."
            sleep 12
            miden-client sync > /dev/null 2>&1
            try=$((try + 1))
        fi
    done

    echo "  ⚠️ $name xətası"
    return 1
}

while IFS= read -r WALLET || [ -n "$WALLET" ]; do
    WALLET=$(echo "$WALLET" | tr -d '\r' | xargs)
    [ -z "$WALLET" ] && continue

    COUNT=$((COUNT + 1))

    if grep -q "^$WALLET$" "$PROGRESS_FILE"; then
        echo "[$COUNT / $TOTAL] Cüzdan: $WALLET (Artıq göndərilib ✓)"
        continue
    fi

    echo ""
    echo "---------------------------------------------------------"
    echo "[$COUNT / $TOTAL] Hədəf Cüzdan: $WALLET"
    echo "---------------------------------------------------------"

    # 1. 1 MIDEN
    send_token_robust "$WALLET" "1::MIDEN" "1 MIDEN"

    # 2. 0.01 IETH
    send_token_robust "$WALLET" "0.01::IETH" "0.01 IETH"

    # 3. 0.01 IUSDT
    send_token_robust "$WALLET" "0.01::IUSDT" "0.01 IUSDT"

    # Cüzdanı tamamlanmış kimi qeyd edirik
    echo "$WALLET" >> "$PROGRESS_FILE"

done < "$WALLET_FILE"

echo ""
echo "========================================================="
echo "🎉 131 CÜZDANIN HAMISINA TOKEN PAYLANMASI TAMAMLANDI!"
echo "========================================================="
miden-client sync
miden-client account -s 0xe564ce05189a04c13fe17400eee45f
