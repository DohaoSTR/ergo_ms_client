<template>
  <div>
    <!-- Блок отображения цен -->
    <div class="prices-and-predictions">
      <!-- Блок последних цен криптовалют -->
      <div class="latest-prices">
        <h3>Последние цены криптовалют (USD):</h3>
        <div v-if="loading" class="loading-indicator">Загрузка...</div>
        <ul v-else-if="filteredCoins.length > 0">
          <li v-for="coin in filteredCoins" :key="coin">
            <strong>{{ coin.toUpperCase() }}</strong>
            <ul v-if="groupedCryptoPrices[coin]?.length > 0">
              <li v-for="crypto in (expandedLists[coin] ? groupedCryptoPrices[coin] : getLastN(groupedCryptoPrices[coin], 7))" :key="`${coin}-actual-${crypto.timestamp.toISOString()}`">
                 {{ crypto.timestamp.toLocaleString('ru-RU') }} — ${{ Number(crypto.price_usd).toFixed(4) }}
                 <span v-if="crypto.change && crypto.change.class !== 'neutral'" :class="['price-change', crypto.change.class]">
                    <template v-if="crypto.change.class === 'positive'">▲ +</template>
                    <template v-if="crypto.change.class === 'negative'">▼ </template>
                    {{ crypto.change.percent.toFixed(2) }}%
                 </span>
              </li>
              <li v-if="groupedCryptoPrices[coin]?.length > 7"
                  @click="toggleListExpansion(coin)"
                  class="toggle-list-button">
                 {{ expandedLists[coin] ? 'Свернуть' : `... еще ${groupedCryptoPrices[coin].length - 7} (Развернуть)` }}
              </li>
            </ul>
            <p v-else class="no-data-message">Нет данных для {{ coin.toUpperCase() }}</p>
          </li>
        </ul>
        <p class="no-data-message" style="margin: auto; color: #6c757d;" v-else-if="!loading && selectedCoins.length > 0">Нет данных для выбранных криптовалют.</p>
        <p class="no-data-message" style="margin: auto; color: #6c757d;" v-else-if="!loading && selectedCoins.length === 0">Выберите криптовалюты.</p>
      </div>

      <!-- Блок последних цен валют -->
      <div class="latest-asset-prices">
        <h3>Последние цены валют (RUB):</h3>
        <div v-if="loading" class="loading-indicator">Загрузка...</div>
        <ul v-else-if="filteredAssets.length > 0">
          <li v-for="assetPair in filteredAssets" :key="assetPair">
            <strong>{{ assetPair }}</strong>
            <ul v-if="groupedAssetPrices[assetPair]?.length > 0">
              <li v-for="asset in (expandedLists[assetPair] ? groupedAssetPrices[assetPair] : getLastN(groupedAssetPrices[assetPair], 7))" :key="`${assetPair}-actual-${asset.timestamp.toISOString()}`">
                 {{ asset.timestamp.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) }} — {{ formatRubPrice(asset.price_rub) }} ₽
                 <span v-if="asset.change && asset.change.class !== 'neutral'" :class="['price-change', asset.change.class]">
                    <template v-if="asset.change.class === 'positive'">▲ +</template>
                    <template v-if="asset.change.class === 'negative'">▼ </template>
                    {{ asset.change.percent.toFixed(2) }}%
                 </span>
              </li>
              <li v-if="groupedAssetPrices[assetPair]?.length > 7"
                  @click="toggleListExpansion(assetPair)"
                  class="toggle-list-button">
                 {{ expandedLists[assetPair] ? 'Свернуть' : `... еще ${groupedAssetPrices[assetPair].length - 7} (Развернуть)` }}
              </li>
            </ul>
             <p v-else class="no-data-message">Нет данных для {{ assetPair }}</p>
          </li>
        </ul>
        <p class="no-data-message" style="margin: auto; color: #6c757d;" v-else-if="!loading && selectedAssets.length > 0">Нет данных для выбранных валютных пар.</p>
        <p class="no-data-message" style="margin: auto; color: #6c757d;" v-else-if="!loading && selectedAssets.length === 0">Выберите валютные пары.</p>
      </div>

      <!-- Блок последних цен акций -->
      <div class="latest-stock-prices">
        <h3>Последние цены акций:</h3>
        <div v-if="loading" class="loading-indicator">Загрузка...</div>
        <ul v-else-if="filteredStocks.length > 0">
          <li v-for="stockName in filteredStocks" :key="stockName">
            <strong>{{ stockName.toUpperCase() }}</strong>
            <ul v-if="groupedStockPrices[stockName]?.length > 0">
              <li v-for="stock in (expandedLists[stockName] ? groupedStockPrices[stockName] : getLastN(groupedStockPrices[stockName], 7))" :key="`${stockName}-actual-${stock.timestamp.toISOString()}`">
                 {{ stock.timestamp.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) }} —
                 {{ stock.price_rub ? formatRubPrice(stock.price_rub) + ' ₽' : '$' + Number(stock.price_usd).toFixed(4) }}
                 <span v-if="stock.change && stock.change.class !== 'neutral'" :class="['price-change', stock.change.class]">
                    <template v-if="stock.change.class === 'positive'">▲ +</template>
                    <template v-if="stock.change.class === 'negative'">▼ </template>
                    {{ stock.change.percent.toFixed(2) }}%
                 </span>
              </li>
              <li v-if="groupedStockPrices[stockName]?.length > 7"
                  @click="toggleListExpansion(stockName)"
                  class="toggle-list-button">
                 {{ expandedLists[stockName] ? 'Свернуть' : `... еще ${groupedStockPrices[stockName].length - 7} (Развернуть)` }}
              </li>
            </ul>
             <p v-else class="no-data-message">Нет данных для {{ stockName }}</p>
          </li>
        </ul>
        <p class="no-data-message" style="margin: auto; color: #6c757d;" v-else-if="!loading && selectedStocks.length > 0">Нет данных для выбранных акций.</p>
        <p class="no-data-message" style="margin: auto; color: #6c757d;" v-else-if="!loading && selectedStocks.length === 0">Выберите акции.</p>
      </div>
    </div>

    <div class="predictions-container">
        <!-- Состояние загрузки -->
        <div v-if="predicting" class="prediction-loading">
            <p>Строим прогнозы...</p>
            <div class="spinner"></div>
        </div>

        <!-- Контейнер с результатами прогнозов -->
        <div class="prediction-columns-container" v-else-if="predictionAttempted">

            <!-- Колонка 1: Прогноз Криптовалют -->
            <div class="prediction-column crypto-predictions">
                <h3>Прогноз цен криптовалют (LSTM)</h3>
                <ul v-if="selectedCoins.length > 0">
                   <li v-for="coin in selectedCoins.sort()" :key="`pred-item-${coin}`">
                       <strong :class="{ 'error-header': !!predictionErrors[coin] }">{{ coin.toUpperCase() }}</strong>

                       <div v-if="predictionSummary[coin] && !predictionErrors[coin]"
                            :class="['prediction-summary', predictionSummary[coin].class]">
                           Тенденция:
                           <span class="summary-value">
                               <template v-if="predictionSummary[coin].class === 'positive'">▲ +</template>
                               <template v-if="predictionSummary[coin].class === 'negative'">▼ </template>
                               {{ predictionSummary[coin].percent.toFixed(2) }}%
                           </span>
                       </div>

                       <!-- Список прогнозов -->
                       <ul v-if="predictedPrices[coin] && predictedPrices[coin].length > 0">
                          <li v-for="prediction in predictedPrices[coin]" :key="`${coin}-pred-${prediction.date.toISOString()}`">
                             {{ prediction.date.toLocaleDateString('ru-RU') }} — ${{ prediction.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) }}
                             <span v-if="useSentiment" class="prediction-tag">(прогноз SLTM с тон.)</span>
                             <span v-else class="prediction-tag">(прогноз LSTM)</span>
                          </li>
                      </ul>

                      <!-- Сообщения об ошибках и отсутствии данных -->
                      <p v-else-if="predictionErrors[coin]" class="prediction-error-message">
                         Не удалось построить прогноз. <span class="error-details">({{ predictionErrors[coin] }})</span>
                      </p>
                       <p v-else-if="predictedPrices.hasOwnProperty(coin) && predictedPrices[coin]?.length === 0 && !predictionErrors[coin]" class="prediction-error-message">
                          Нет данных прогноза.
                       </p>
                       <p v-else class="prediction-info-message"> Нет данных или прогноз не запущен. </p>
                  </li>
                </ul>
                <p v-else class="no-data-message">Криптовалюты для прогноза не выбраны.</p>
            </div>

            <!-- Колонка 2: Прогноз Валют -->
            <div class="prediction-column forex-predictions">
                <h3>Прогноз цен валют (LSTM)</h3>
                 <ul v-if="selectedAssets.length > 0">
                     <li v-for="assetPair in selectedAssets.sort()" :key="`pred-item-asset-${assetPair}`">
                         <strong :class="{ 'error-header': !!predictionAssetErrors[assetPair] }">{{ assetPair }}</strong>

                         <div v-if="predictionAssetSummary[assetPair] && !predictionAssetErrors[assetPair]"
                             :class="['prediction-summary', predictionAssetSummary[assetPair].class]">
                             Тенденция:
                             <span class="summary-value">
                                 <template v-if="predictionAssetSummary[assetPair].class === 'positive'">▲ +</template>
                                 <template v-if="predictionAssetSummary[assetPair].class === 'negative'">▼ </template>
                                 {{ predictionAssetSummary[assetPair].percent.toFixed(2) }}%
                             </span>
                         </div>

                         <!-- Список прогнозов -->
                         <ul v-if="predictedAssetPrices[assetPair] && predictedAssetPrices[assetPair].length > 0">
                             <li v-for="prediction in predictedAssetPrices[assetPair]" :key="`${assetPair}-pred-${prediction.date.toISOString()}`">
                                 {{ prediction.date.toLocaleDateString('ru-RU') }} — {{ prediction.price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) }} ₽
                                 <span class="prediction-tag">(прогноз LSTM)</span>
                             </li>
                         </ul>

                         <!-- Сообщения об ошибках и отсутствии данных -->
                         <p v-else-if="predictionAssetErrors[assetPair]" class="prediction-error-message">
                             Не удалось построить прогноз. <span class="error-details">({{ predictionAssetErrors[assetPair] }})</span>
                         </p>
                         <p v-else-if="predictedAssetPrices.hasOwnProperty(assetPair) && predictedAssetPrices[assetPair]?.length === 0 && !predictionAssetErrors[assetPair]" class="prediction-error-message">
                             Нет данных прогноза.
                         </p>
                         <p v-else class="prediction-info-message">Нет данных или прогноз не запущен.</p>
                     </li>
                 </ul>
                <p v-else class="no-data-message">Валютные пары для прогноза не выбраны.</p>
            </div>

            <!-- Колонка 3: Прогноз Акций -->
            <div class="prediction-column stock-predictions">
                <h3>Прогноз цен акций (LSTM)</h3>
                <ul v-if="selectedStocks.length > 0">
                     <li v-for="stockName in selectedStocks.sort()" :key="`pred-item-stock-${stockName}`">
                         <strong :class="{ 'error-header': !!predictionStockErrors[stockName] }">{{ stockName.toUpperCase() }}</strong>

                         <div v-if="predictionStockSummary[stockName] && !predictionStockErrors[stockName]"
                             :class="['prediction-summary', predictionStockSummary[stockName].class]">
                             Тенденция:
                             <span class="summary-value">
                                 <template v-if="predictionStockSummary[stockName].class === 'positive'">▲ +</template>
                                 <template v-if="predictionStockSummary[stockName].class === 'negative'">▼ </template>
                                 {{ predictionStockSummary[stockName].percent.toFixed(2) }}%
                             </span>
                         </div>

                         <!-- Список прогнозов -->
                         <ul v-if="predictedStockPrices[stockName] && predictedStockPrices[stockName].length > 0">
                             <li v-for="prediction in predictedStockPrices[stockName]" :key="`${stockName}-pred-${prediction.date.toISOString()}`">
                                 {{ prediction.date.toLocaleDateString('ru-RU') }} — {{ prediction.price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) }}
                                 <span class="prediction-tag">(прогноз LSTM)</span>
                             </li>
                         </ul>

                         <!-- Сообщения об ошибках и отсутствии данных -->
                         <p v-else-if="predictionStockErrors[stockName]" class="prediction-error-message">
                             Не удалось построить прогноз. <span class="error-details">({{ predictionStockErrors[stockName] }})</span>
                         </p>
                         <p v-else-if="predictedStockPrices.hasOwnProperty(stockName) && predictedStockPrices[stockName]?.length === 0 && !predictionStockErrors[stockName]" class="prediction-error-message">
                             Нет данных прогноза.
                         </p>
                         <p v-else class="prediction-info-message">Нет данных или прогноз не запущен.</p>
                     </li>
                 </ul>
                <p v-else class="no-data-message">Акции для прогноза не выбраны.</p>
            </div>
        </div>

        <div class="prediction-placeholder" v-else-if="!loading && !predicting && !predictionAttempted">
           <p>Запустите прогноз для отображения результатов.</p>
        </div>
    </div>

    <!-- Секция графика -->
    <h3>График изменения цены (Криптовалюты):</h3>
    <div class="chart-container" style="height: 450px; position: relative;">
      <Line
        v-if="chartData.datasets.length > 0 && !loading"
        :key="chartKey"
        :data="chartData"
        :options="chartOptions"
        style="height: 100%; width: 100%;"
      />
      <p v-else-if="loading">Загрузка данных графика...</p>
      <p v-else-if="predicting">Нет данных для отображения графика (проверьте выбранные криптовалюты и диапазон дат).</p>
      <p v-else>Нет данных для отображения графика (проверьте выбранные криптовалюты и диапазон дат).</p>
    </div>

    <!-- Секция управления -->
    <div class="controls-container">
      <!-- Выбор дат и Параметры прогноза (теперь объединены) -->
      <div class="date-selector">
        <label for="startDate">Начальная дата (график/новости):</label>
        <input type="date" id="startDate" v-model="startDate" :max="endDate" @change="handleDateChange" />
        <label for="endDate">Конечная дата (график/новости/прогноз):</label>
        <input type="date" id="endDate" v-model="endDate" :min="startDate" :max="getTodayDateString()" @change="handleDateChange" />
        <p class="param-info">(Прогноз использует данные ДО этой даты. Новости фильтруются ПО этой дате)</p>

        <!-- Параметры прогноза -->
        <div class="prediction-params">
        <!-- 1. Главный переключатель для всех параметров -->
        <label class="checkbox-label toggle-advanced-params">
            <input type="checkbox" v-model="showAdvancedParams" />
            <strong>Настроить параметры прогноза</strong>
        </label>

        <!-- 2. Сворачиваемый контейнер для всех расширенных настроек -->
        <div v-if="showAdvancedParams" class="advanced-prediction-inputs">
            <!-- Дни обучения и прогноза -->
            <label for="trainDays">Дней для обучения:</label>
            <input type="number" id="trainDays" v-model.number="trainDays" min="61" max="3000" step="10" @change="clearPredictions">

            <label for="predictDays">Дней для прогноза:</label>
            <input type="number" id="predictDays" v-model.number="predictDays" min="1" max="30" step="1" @change="clearPredictions">

            <!-- 3. Блок для тональности (внутри основного контейнера) -->
            <div class="sentiment-controls">
                <label class="checkbox-label sentiment-toggle">
                    <input type="checkbox" v-model="useSentiment" @change="clearPredictions"/>
                    <strong>Учитывать "Тональность" новостей</strong>
                </label>
                <!-- Поле для окна тональности -->
                <div v-if="useSentiment" class="sentiment-inputs">
                    <label for="sentimentWindow">Окно "Тональности" (дни):</label>
                    <input type="number" id="sentimentWindow" v-model.number="sentimentWindow" min="1" max="30" step="1" @change="clearPredictions">
                </div>
            </div>
        </div>
      </div>
      </div>

      <!-- Выбор криптовалют -->
      <div class="coin-selector">
         <label class="checkbox-label select-all">
            <input
              type="checkbox"
              @change="toggleAllCoins"
              :checked="selectedCoins.length === availableCoins.length && availableCoins.length > 0"
              :indeterminate="selectedCoins.length > 0 && selectedCoins.length < availableCoins.length"
            />
            <strong>Криптовалюты (График/Обновление/Прогноз)</strong>
         </label>
         <div class="scrollable-list">
           <label v-for="coin in availableCoins" :key="coin" class="checkbox-label">
             <input type="checkbox" v-model="selectedCoins" :value="coin" @change="clearPredictions"/>
             {{ coin.toUpperCase() }}
           </label>
         </div>
      </div>

      <!-- Выбор валют -->
      <div class="asset-selector">
         <label class="checkbox-label select-all">
            <input
              type="checkbox"
              @change="toggleAllAssets"
              :checked="selectedAssets.length === availableAssets.length && availableAssets.length > 0"
              :indeterminate="selectedAssets.length > 0 && selectedAssets.length < availableAssets.length"
            />
            <strong>Валюты (Список/Обновление/Прогноз)</strong>
         </label>
         <div class="scrollable-list">
           <label v-for="assetPair in availableAssets" :key="assetPair" class="checkbox-label">
             <input type="checkbox" v-model="selectedAssets" :value="assetPair" @change="clearPredictions" />
             {{ assetPair }}
           </label>
         </div>
      </div>

      <!-- Выбор акций -->
      <div class="stock-selector">
         <label class="checkbox-label select-all">
            <input
              type="checkbox"
              @change="toggleAllStocks"
              :checked="selectedStocks.length === Object.keys(availableStocks).length && Object.keys(availableStocks).length > 0"
              :indeterminate="selectedStocks.length > 0 && selectedStocks.length < Object.keys(availableStocks).length"
            />
            <strong>Акции (Список/Обновление/Прогноз)</strong>
         </label>
         <div class="scrollable-list">
           <label v-for="stockName in Object.keys(availableStocks)" :key="stockName" class="checkbox-label">
             <input type="checkbox" v-model="selectedStocks" :value="stockName" @change="clearPredictions" />
             {{ stockName }}
           </label>
         </div>
      </div>
    </div>

    <div class="extra-controls">
        <label class="checkbox-label">
            <input type="checkbox" v-model="skipNewsUpdate" />
            Не обновлять новости
        </label>
    </div>

    <!-- Кнопки действий -->
    <div class="button-container">
      <button @click="fetchPrice" :disabled="loading || predicting || newsLoading">
        {{ loading ? 'Обновление...' : 'Обновить данные' }}
      </button>
      <button @click="predictPrices" :disabled="loading || predicting || newsLoading || (selectedCoins.length === 0 && selectedAssets.length === 0 && selectedStocks.length === 0)" class="predict-button">
         {{ predicting ? 'Прогнозирование...' : 'Построить прогноз' }}
       </button>
      <button @click="exportToCSV" :disabled="loading || predicting || newsLoading || cryptoPrices.length === 0 || selectedCoins.length === 0">Экспорт в CSV</button>
      <button @click="triggerFileInput" :disabled="loading || predicting || newsLoading">Импорт из CSV</button>
      <button @click="confirmDeleteAll" :disabled="loading || predicting || newsLoading" class="delete-button">
        Удалить данные
      </button>
      <button @click="deleteModels" :disabled="loading || predicting || newsLoading" class="utility-button">
        Удалить модели прогнозов
      </button>
    </div>

    <!-- Блок новостей -->
    <div class="news-section">
        <h3>Новостной фон</h3>
        <div class="news-filters">
            <div>
                <label for="newsFilterCoins">Фильтр по криптовалютам (новости):</label>
                <select id="newsFilterCoins" v-model="newsFilterCoins" multiple size="4">
                     <option value="">(Все)</option>
                     <option v-for="coin in availableCoins" :key="`nf-${coin}`" :value="coin">{{ coin.toUpperCase() }}</option>
                </select>
                <p class="param-info">(Ctrl/Cmd + Click для выбора нескольких)</p>
            </div>
            <div>
                <label for="newsFilterSentiment">Фильтр по тональности:</label>
                <select id="newsFilterSentiment" v-model="newsFilterSentiment">
                    <option value="">(Любая)</option>
                    <option value="positive">Позитивная</option>
                    <option value="negative">Негативная</option>
                    <option value="neutral">Нейтральная</option>
                </select>
            </div>
             <button @click="fetchNewsData(1)" :disabled="newsLoading" class="filter-button">
                 {{ newsLoading ? 'Загрузка...' : 'Применить фильтры новостей' }}
             </button>
        </div>
        <div v-if="newsLoading" class="loading-indicator">Загрузка новостей...</div>
        <div v-else-if="newsError" class="error-message">{{ newsError }}</div>
        <div v-else-if="newsArticles.length > 0" class="news-list-container">
            <ul class="news-list">
                <li v-for="article in newsArticles" :key="article.id" class="news-item">
                    <div class="news-header">
                        <span class="news-date">{{ formatDate(article.published_at) }}</span>
                        <span class="news-source">Источник: {{ article.source || 'N/A' }}</span>
                        <span :class="['sentiment-label', article.sentiment_label]">{{ article.sentiment_display || 'N/A' }}</span>
                        <span class="sentiment-score">(Score: {{ formatScore(article.sentiment_score) }})</span>
                    </div>
                    <h4 class="news-title">
                        <a :href="article.url" target="_blank" rel="noopener noreferrer">{{ article.title }}</a>
                    </h4>
                    <p class="news-summary" v-if="article.summary">{{ article.summary }}</p>
                    <div class="news-footer">
                        <span v-if="article.relevant_coins?.length > 0" class="relevant-coins">
                            Криптовалюты: {{ article.relevant_coins.join(', ') }}
                        </span>
                    </div>
                </li>
            </ul>
            <div class="pagination-controls" v-if="newsPagination.totalPages > 1">
                <button @click="fetchNewsData(newsPagination.currentPage - 1)" :disabled="newsPagination.currentPage <= 1 || newsLoading">
                    « Пред.
                </button>
                <span>Страница {{ newsPagination.currentPage }} из {{ newsPagination.totalPages }} (Всего: {{ newsPagination.totalCount }})</span>
                <button @click="fetchNewsData(newsPagination.currentPage + 1)" :disabled="newsPagination.currentPage >= newsPagination.totalPages || newsLoading">
                    След. »
                </button>
            </div>
        </div>
        <p v-else class="no-data-message">Новости по заданным фильтрам не найдены.</p>
    </div>
    <input type="file" ref="fileInput" @change="handleFileUpload" accept=".csv" style="display: none" />

    <!-- Уведомления -->
    <transition name="popup">
      <div v-if="updateSuccess" class="popup success">{{ updateMessage }}</div>
    </transition>
    <transition name="popup-error">
      <div v-if="updateError" class="popup error">{{ updateMessage }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { Line } from 'vue-chartjs';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

// --- Утилиты ---
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getDefaultStartDate = () => new Date('2020-01-01').toISOString().split('T')[0];
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try { return new Date(isoString).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }); }
    catch (e) { return isoString; }
};
const formatScore = (score) => (score === null || score === undefined) ? 'N/A' : score.toFixed(3);
const formatRubPrice = (price) => (price === null || price === undefined) ? 'N/A' : Number(price).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

// --- Состояния ---
const cryptoPrices = ref([]);
const assetPrices = ref([]);
const stockPrices = ref([]);
const updateSuccess = ref(false);
const updateError = ref(false);
const updateMessage = ref('');
const loading = ref(false);
const predicting = ref(false);
const predictionAttempted = ref(false);
const startDate = ref(getDefaultStartDate());
const endDate = ref(getTodayDateString());
const selectedCoins = ref(["bitcoin", "ethereum"]);
const availableCoins = ref(["bitcoin", "ethereum", "bnb", "xrp", "cardano", "dogecoin", "solana", "polkadot", "tron", "litecoin"]);
const selectedAssets = ref(['USD/RUB', 'EUR/RUB']);
const availableAssets = ref(['USD/RUB', 'EUR/RUB', 'CNY/RUB', 'GBP/RUB', 'KZT/RUB']);
const availableStocks = ref({
    'Tesla': { ticker: 'TSLA' },
    'Лукойл': { ticker: 'LKOH' }
});
const selectedStocks = ref(['Tesla', 'Лукойл']);
const chartData = ref({ datasets: [] });
const chartKey = ref(0);
const fileInput = ref(null);
const colorCache = ref({});
const expandedLists = ref({});
const trainDays = ref(730);
const predictDays = ref(7);
const predictedPrices = ref({});
const predictionErrors = ref({});
const predictedAssetPrices = ref({});
const predictionAssetErrors = ref({});
const predictedStockPrices = ref({});
const predictionStockErrors = ref({});
const useSentiment = ref(false);
const sentimentWindow = ref(7);
const sentimentFactor = ref(0.024);
const newsArticles = ref([]);
const newsLoading = ref(false);
const newsError = ref('');
const newsFilterCoins = ref([]);
const newsFilterSentiment = ref('');
const newsPagination = ref({ currentPage: 1, totalPages: 1, totalCount: 0, pageSize: 20 });
const skipNewsUpdate = ref(false);
const showAdvancedParams = ref(false);

// --- Сбор данных ---
const fetchData = async () => {
  console.log("Запрос цен КРИПТОВАЛЮТ...");
  try {
    const response = await axios.get('http://localhost:8000/api/ETL/analyze/crypto-prices/');
    
    cryptoPrices.value = response.data.map(c => ({ ...c, timestamp: new Date(c.timestamp) })).sort((a, b) => a.timestamp - b.timestamp);
    console.log(`КРИПТОВАЛЮТЫ: получено ${cryptoPrices.value.length} записей.`);
    updateChartData();
  } catch (error) {
    console.error('Ошибка загрузки цен КРИПТОВАЛЮТ:', error);
    showPopup(`Не удалось загрузить цены криптовалют: ${error.response?.data?.detail || error.message}`, true);
    cryptoPrices.value = [];
  } finally {
     console.log("Загрузка КРИПТОВАЛЮТ завершена.");
  }
};
const fetchAssetData = async () => {
  console.log("Запрос курсов ВАЛЮТ...");
  try {
    const response = await axios.get('http://localhost:8000/api/ETL/analyze/assets-prices/');
    assetPrices.value = response.data.map(a => ({ ...a, timestamp: new Date(a.timestamp) })).sort((a, b) => a.timestamp - b.timestamp);
    console.log(`ВАЛЮТЫ: получено ${assetPrices.value.length} записей.`);
  } catch (error) {
    console.error('Ошибка загрузки курсов ВАЛЮТ:', error);
    assetPrices.value = [];
  } finally {
    console.log("Загрузка ВАЛЮТ завершена.");
  }
};
const fetchStockData = async () => {
  console.log("Запрос цен АКЦИЙ...");
  try {
    const response = await axios.get('http://localhost:8000/api/ETL/analyze/stock-prices/');
    const tickerToNameMap = Object.fromEntries(
        Object.entries(availableStocks.value).map(([name, data]) => [data.ticker, name])
    );
    stockPrices.value = response.data.map(s => ({
        ...s,
        name: tickerToNameMap[s.ticker] || s.ticker,
        timestamp: new Date(s.timestamp)
    })).sort((a, b) => a.timestamp - b.timestamp);
    console.log(`АКЦИИ: получено ${stockPrices.value.length} записей.`);
  } catch (error) {
    console.error('Ошибка загрузки цен АКЦИЙ:', error);
    stockPrices.value = [];
  } finally {
    console.log("Загрузка АКЦИЙ завершена.");
  }
};
const fetchNewsData = async (page = 1) => {
    newsLoading.value = true; newsError.value = '';
    console.log(`Запрос новостей: Стр ${page}, Даты ${startDate.value}-${endDate.value}, Криптовалюты [${newsFilterCoins.value.join(', ')}], Sentiment ${newsFilterSentiment.value || 'Любой'}`);
    try {
        const params = { page: page, page_size: newsPagination.value.pageSize, startDate: startDate.value, endDate: endDate.value, coins: newsFilterCoins.value.length > 0 ? newsFilterCoins.value.join(',') : undefined, sentiment: newsFilterSentiment.value || undefined };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        const response = await axios.get('http://localhost:8000/api/ETL/analyze/news/', { params });
        newsArticles.value = response.data.results;
        newsPagination.value.totalCount = response.data.count; newsPagination.value.totalPages = Math.ceil(response.data.count / newsPagination.value.pageSize); newsPagination.value.currentPage = page;
        console.log(`Получено ${newsArticles.value.length} новостей (Всего: ${response.data.count}).`);
    } catch (error) {
        console.error('Ошибка загрузки новостей:', error); const message = error.response?.data?.detail || error.message || 'Неизвестная ошибка'; newsError.value = `Не удалось загрузить новости: ${message}`; newsArticles.value = []; newsPagination.value = { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: 20 };
    } finally { newsLoading.value = false; }
};

// --- Сортировка и группировка ---
const groupedCryptoPrices = computed(() => {
    const groups = {};
    for (const crypto of cryptoPrices.value) {
        if (selectedCoins.value.includes(crypto.name)) {
            if (!groups[crypto.name]) groups[crypto.name] = [];
            groups[crypto.name].push(crypto);
        }
    }
    for (const key in groups) {
        groups[key].sort((a, b) => a.timestamp - b.timestamp);
        for (let i = 0; i < groups[key].length; i++) {
            if (i === 0) {
                groups[key][i].change = null;
                continue;
            }
            const currentPrice = Number(groups[key][i].price_usd);
            const prevPrice = Number(groups[key][i - 1].price_usd);
            if (prevPrice > 0) {
                const percent = ((currentPrice - prevPrice) / prevPrice) * 100;
                groups[key][i].change = {
                    percent: percent,
                    class: percent > 0.001 ? 'positive' : (percent < -0.001 ? 'negative' : 'neutral')
                };
            } else {
                groups[key][i].change = null;
            }
        }
    }
    return groups;
});
const filteredCoins = computed(() => selectedCoins.value.filter(coin => groupedCryptoPrices.value[coin]?.length > 0).sort());
const groupedAssetPrices = computed(() => {
    const groups = {};
    for (const asset of assetPrices.value) {
        const key = `${asset.name_usd}/${asset.name_rub}`;
        if (selectedAssets.value.includes(key)) {
            if (!groups[key]) groups[key] = [];
            groups[key].push(asset);
        }
    }
    for (const key in groups) {
        groups[key].sort((a, b) => a.timestamp - b.timestamp);
        for (let i = 0; i < groups[key].length; i++) {
            if (i === 0) {
                groups[key][i].change = null;
                continue;
            }
            const currentPrice = Number(groups[key][i].price_rub);
            const prevPrice = Number(groups[key][i - 1].price_rub);
            if (prevPrice > 0) {
                const percent = ((currentPrice - prevPrice) / prevPrice) * 100;
                groups[key][i].change = {
                    percent: percent,
                    class: percent > 0.001 ? 'positive' : (percent < -0.001 ? 'negative' : 'neutral')
                };
            } else {
                groups[key][i].change = null;
            }
        }
    }
    return groups;
});
const groupedStockPrices = computed(() => {
    const groups = {};
    for (const stock of stockPrices.value) {
        if (selectedStocks.value.includes(stock.name)) {
            if (!groups[stock.name]) groups[stock.name] = [];
            groups[stock.name].push(stock);
        }
    }
    for (const key in groups) {
        groups[key].sort((a, b) => a.timestamp - b.timestamp);
        for (let i = 0; i < groups[key].length; i++) {
            if (i === 0) {
                groups[key][i].change = null;
                continue;
            }
            const currentPrice = Number(groups[key][i].price_rub ?? groups[key][i].price_usd);
            const prevPrice = Number(groups[key][i - 1].price_rub ?? groups[key][i-1].price_usd);
            if (prevPrice > 0) {
                const percent = ((currentPrice - prevPrice) / prevPrice) * 100;
                groups[key][i].change = {
                    percent: percent,
                    class: percent > 0.001 ? 'positive' : (percent < -0.001 ? 'negative' : 'neutral')
                };
            } else {
                groups[key][i].change = null;
            }
        }
    }
    return groups;
});

const filteredAssets = computed(() => selectedAssets.value.filter(pair => groupedAssetPrices.value[pair]?.length > 0).sort());
const filteredStocks = computed(() => selectedStocks.value.filter(name => groupedStockPrices.value[name]?.length > 0).sort());

const predictionSummary = computed(() => {
  const summary = {};
  for (const coin in predictedPrices.value) {
    const predictions = predictedPrices.value[coin];
    if (predictions && predictions.length >= 2) {
      const firstPrice = predictions[0].price;
      const lastPrice = predictions[predictions.length - 1].price;
      if (firstPrice > 0) {
        const percent = ((lastPrice - firstPrice) / firstPrice) * 100;
        summary[coin] = {
          percent: percent,
          class: percent > 0.01 ? 'positive' : (percent < -0.01 ? 'negative' : 'neutral'),
        };
      }
    }
  }
  return summary;
});
const predictionAssetSummary = computed(() => {
  const summary = {};
  for (const assetPair in predictedAssetPrices.value) {
    const predictions = predictedAssetPrices.value[assetPair];
    if (predictions && predictions.length >= 2) {
      const firstPrice = predictions[0].price;
      const lastPrice = predictions[predictions.length - 1].price;
      if (firstPrice > 0) {
        const percent = ((lastPrice - firstPrice) / firstPrice) * 100;
        summary[assetPair] = {
          percent: percent,
          class: percent > 0.01 ? 'positive' : (percent < -0.01 ? 'negative' : 'neutral'),
        };
      }
    }
  }
  return summary;
});
const predictionStockSummary = computed(() => {
  const summary = {};
  for (const stockName in predictedStockPrices.value) {
    const predictions = predictedStockPrices.value[stockName];
    if (predictions && predictions.length >= 2) {
      const firstPrice = predictions[0].price;
      const lastPrice = predictions[predictions.length - 1].price;
      if (firstPrice > 0) {
        const percent = ((lastPrice - firstPrice) / firstPrice) * 100;
        summary[stockName] = {
          percent: percent,
          class: percent > 0.01 ? 'positive' : (percent < -0.01 ? 'negative' : 'neutral'),
        };
      }
    }
  }
  return summary;
});
const getLastN = (arr, n) => arr ? arr.slice(-n) : [];

// --- График ---
const updateChartData = () => {
    console.log("Обновление данных графика (криптовалюты)...");
    const startFilterDate = new Date(startDate.value); startFilterDate.setUTCHours(0,0,0,0); const endFilterDate = new Date(endDate.value); endFilterDate.setUTCHours(23,59,59,999);
    const datasets = selectedCoins.value.map((coin) => {
        const coinDataSorted = cryptoPrices.value.filter(c => c.name === coin).sort((a,b) => a.timestamp - b.timestamp);
        const coinDataFiltered = coinDataSorted.filter(c => c.timestamp.getTime() >= startFilterDate.getTime() && c.timestamp.getTime() <= endFilterDate.getTime());
        const dataPoints = coinDataFiltered.map(c => ({ x: c.timestamp, y: c.price_usd }));
        const pointRadius = dataPoints.length > 500 ? 0 : (dataPoints.length > 100 ? 1 : 2);
        return { label: coin.toUpperCase(), data: dataPoints, borderColor: getRandomColor(coin), backgroundColor: 'rgba(0,0,0,0)', tension: 0.1, pointRadius, pointHoverRadius: 5, borderWidth: 1.5 };
    }).filter(d => d.data.length > 0);
    chartData.value = { datasets }; console.log("Данные графика обновлены:", datasets.length, "датасетов"); chartKey.value++;
};
const chartOptions = computed(() => {
    return { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', axis: 'x', intersect: false }, scales: { x: { type: 'time', time: { parser: 'auto', unit: determineTimeUnit(startDate.value, endDate.value), tooltipFormat: 'dd.MM.yyyy HH:mm', displayFormats: { millisecond: 'HH:mm:ss.SSS', second: 'HH:mm:ss', minute: 'dd.MM HH:mm', hour: 'dd.MM HH:00', day: 'dd.MM.yy', week: 'dd MMM yy', month: 'MMM yyyy', quarter: "'Q'Q yyyy", year: 'yyyy' } }, title: { display: true, text: 'Дата' }, ticks: { source: 'auto', maxRotation: 30, minRotation: 0, autoSkip: true, padding: 5, } }, y: { title: { display: true, text: 'Цена (USD)' }, ticks: { callback: function(value) { const minDigits = value < 1 ? (value < 0.01 ? 4 : 2) : 2; const maxDigits = value < 1 ? (value < 0.01 ? 6 : 4) : 2; return '$' + value.toLocaleString('en-US', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits }); } } } }, plugins: { tooltip: { callbacks: { title: function(tooltipItems) { if (tooltipItems.length > 0) { const date = new Date(tooltipItems[0].parsed.x); return date.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'medium' }); } return ''; }, label: function(context) { let label = context.dataset.label || ''; if (label) { label += ': '; } if (context.parsed.y !== null) { label += '$' + context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }); } return label; } } }, legend: { position: 'top' }, decimation: { enabled: true, algorithm: 'lttb', samples: determineSamples(startDate.value, endDate.value), } }, spanGaps: false, };
});
const determineTimeUnit = (start, end) => {
    const diffTime = Math.abs(new Date(end) - new Date(start)); const diffDays = diffTime / (1000 * 60 * 60 * 24); if (diffDays <= 2) return 'hour'; if (diffDays <= 31) return 'day'; if (diffDays <= 180) return 'week'; if (diffDays <= 366 * 2) return 'month'; return 'year';
};
const determineSamples = (start, end) => {
    const diffTime = Math.abs(new Date(end) - new Date(start)); const diffDays = diffTime / (1000 * 60 * 60 * 24); if (diffDays <= 7) return 500; if (diffDays <= 30) return 400; if (diffDays <= 180) return 300; if (diffDays <= 366) return 250; return 200;
};

watch([selectedCoins, startDate, endDate], updateChartData, { deep: true });
let newsDateTimer = null;
watch([startDate, endDate], () => { clearTimeout(newsDateTimer); newsDateTimer = setTimeout(() => { fetchNewsData(1); }, 500); });

const clearPredictions = () => {
    if (predictionAttempted.value) {
        predictedPrices.value = {};
        predictionErrors.value = {};
        predictedAssetPrices.value = {};
        predictionAssetErrors.value = {};
        predictedStockPrices.value = {};
        predictionStockErrors.value = {};
        predictionAttempted.value = false;
        console.log("Прогнозы сброшены.");
    }
};
const showPopup = (message, isError = false, duration = 4000) => { updateMessage.value = message; updateError.value = isError; updateSuccess.value = !isError; setTimeout(clearPopups, duration);};
const clearPopups = () => { updateSuccess.value = false; updateError.value = false; updateMessage.value = '';};
const toggleListExpansion = (keyName) => expandedLists.value[keyName] = !expandedLists.value[keyName];
const handleDateChange = () => clearPredictions();
const fetchPrice = async () => {
  if (!startDate.value || !endDate.value) { showPopup('Пожалуйста, выберите начальную и конечную даты.', true); return; }
  if (new Date(startDate.value) > new Date(endDate.value)) { showPopup('Начальная дата не может быть позже конечной.', true); return; }
  const coinsToUpdate = selectedCoins.value;
  const assetsToUpdate = selectedAssets.value;
  const stocksToUpdate = selectedStocks.value;
  const shouldUpdatePrices = coinsToUpdate.length > 0 || assetsToUpdate.length > 0 || stocksToUpdate.length > 0;
  const shouldUpdateNews = !skipNewsUpdate.value;
  if (!shouldUpdatePrices && !shouldUpdateNews) { showPopup('Нечего обновлять. Выберите криптовалюты/валюты/акции или включите обновление новостей.', true); return; }
  loading.value = true;
  clearPopups();
  clearPredictions();
  if (shouldUpdatePrices) {
    const payload_price = {
        command: 'fetch_price',
        startDate: startDate.value,
        endDate: endDate.value,
        ...(coinsToUpdate.length > 0 && { coins: coinsToUpdate }),
        ...(assetsToUpdate.length > 0 && { assets: assetsToUpdate }),
        ...(stocksToUpdate.length > 0 && { stocks: stocksToUpdate })
    };
    console.log(`Запрос обновления цен/валют/акций:`, payload_price); showPopup('Обновление цен...', false, 3000);
    try {
      const response_price = await axios.post('http://localhost:8000/api/ETL/analyze/execute-command/', payload_price);
      console.log("fetch_price выполнен:", response_price.data?.output); let msg = 'Данные цен обновлены!'; if (response_price.data?.errors) { msg += ` Предупреждения: ${response_price.data.errors.substring(0, 100)}...`; showPopup(msg, false, 6000); } else { showPopup(msg); }
    } catch (error) { console.error('Ошибка fetch_price:', error.response?.data || error.message); showPopup(`Ошибка обновления ЦЕН: ${error.response?.data?.message || error.message || 'Неизвестная'}`, true, 6000); }
  } else { console.log("Обновление цен пропущено, так как ничего не выбрано."); }
  if (shouldUpdateNews) {
      console.log(`Запрос обновления НОВОСТЕЙ...`); showPopup('Обновление новостей', false, 3000);
      try {
          const payload_news = { command: 'fetch_news', startDate: startDate.value, endDate: endDate.value }; const response_news = await axios.post('http://127.0.0.1:8000/api/analyze/execute-command/', payload_news);
          console.log("fetch_news выполнен:", response_news.data?.output); let msg = 'Новости обновлены!'; if (response_news.data?.errors) { msg += ` Предупреждения: ${response_news.data.errors.substring(0, 100)}...`; showPopup(msg, false, 6000); } else { showPopup(msg); } await fetchNewsData(newsPagination.value.currentPage || 1);
      } catch (newsError) { console.error('Ошибка fetch_news:', newsError.response?.data || newsError.message); showPopup(`Ошибка обновления НОВОСТЕЙ: ${newsError.response?.data?.message || newsError.message || 'Неизвестная'}`, true, 6000); }
  } else { console.log("Обновление новостей пропущено пользователем."); }
  console.log("Перезагрузка данных на фронтенде...");
  if (shouldUpdatePrices) { await Promise.all([fetchData(), fetchAssetData(), fetchStockData()]); }
  loading.value = false;
};
const confirmDeleteAll = () => { if (window.confirm('ВЫ УВЕРЕНЫ, что хотите удалить ВСЕ исторические данные (цены криптовалют, курсы валют, цены акций, новости) из базы данных?\n\nЭто действие НЕОБРАТИМО!')) { deleteAllPrices(); } else { console.log("Удаление отменено."); } };
const deleteAllPrices = async () => {
    loading.value = true; clearPopups(); clearPredictions(); console.log("Запрос на удаление всех данных...");
    try {
        const payload = { command: 'delete_all' }; const response = await axios.post('http://localhost:8000/api/ETL/analyze/execute-command/', payload);
        console.log("delete_all выполнен:", response.data); showPopup(response.data?.message || 'Все записи удалены!');
        cryptoPrices.value = []; assetPrices.value = []; stockPrices.value = [];
        predictedPrices.value = {}; predictionErrors.value = {};
        predictedAssetPrices.value = {}; predictionAssetErrors.value = {};
        predictedStockPrices.value = {}; predictionStockErrors.value = {};
        predictionAttempted.value = false; updateChartData();
        newsArticles.value = []; newsPagination.value = { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: 20 };
    } catch (error) { console.error('Ошибка удаления:', error.response?.data || error.message); showPopup(`Ошибка удаления: ${error.response?.data?.message || error.message || 'Неизвестная'}`, true, 6000); } finally { loading.value = false; }
};
const deleteModels = async () => {
    if (!window.confirm('ВЫ УВЕРЕНЫ, что хотите удалить все сохраненные (закэшированные) модели прогнозов?\n\nЭто действие не удалит данные из БД, но следующий запуск прогноза будет заново обучать модели.')) { console.log("Удаление моделей отменено."); return; }
    loading.value = true; clearPopups(); console.log("Запрос на удаление моделей прогнозов...");
    try {
        const payload = { command: 'delete_models' }; const response = await axios.post('http://localhost:8000/api/ETL/analyze/execute-command/', payload);
        console.log("delete_models выполнен:", response.data); showPopup(response.data?.message || 'Модели прогнозов успешно удалены!');
    } catch (error) { console.error('Ошибка удаления моделей:', error.response?.data || error.message); showPopup(`Ошибка удаления моделей: ${error.response?.data?.message || error.message || 'Неизвестная'}`, true, 6000); } finally { loading.value = false; }
};
const predictPrices = async () => {
    // 1. Валидация
    if (selectedCoins.value.length === 0 && selectedAssets.value.length === 0 && selectedStocks.value.length === 0) { showPopup('Выберите активы для прогноза.', true); return; }
    if (!trainDays.value || trainDays.value < 61) { showPopup('Дней обучения должно быть >= 61.', true); return;}
    if (!predictDays.value || predictDays.value < 1) { showPopup('Дней для прогноза должно быть >= 1.', true); return;}
    if (!endDate.value) { showPopup('Выберите конечную дату для прогноза.', true); return; }
    if (useSentiment.value) { if (!sentimentWindow.value || sentimentWindow.value < 1 || sentimentWindow.value > 30) { showPopup('Окно "Тональности" должно быть в диапазоне 1-30.', true); return;} }

    // 2. Установка состояния
    predicting.value = true;
    predictionAttempted.value = true;
    clearPopups();
    predictedPrices.value = {};
    predictionErrors.value = {};
    predictedAssetPrices.value = {};
    predictionAssetErrors.value = {};
    predictedStockPrices.value = {};
    predictionStockErrors.value = {};
    console.log(`Запрос прогноза: Криптовалюты: [${selectedCoins.value.join(', ')}], Валюты: [${selectedAssets.value.join(', ')}], Акции: [${selectedStocks.value.join(', ')}]`);

    // 3. Обращение
    const coinPredictionPromises = selectedCoins.value.map(coin => {
        const payload = { coin, trainDays: trainDays.value, predictDays: predictDays.value, endDate: endDate.value, useSentiment: useSentiment.value, sentimentWindow: sentimentWindow.value, sentimentFactor: sentimentFactor.value };
        return axios.post('http://localhost:8000/api/ETL/analyze/predict-crypto/', payload)
            .then(response => ({ type: 'coin', name: coin, data: response.data, status: 'fulfilled' }))
            .catch(error => ({ type: 'coin', name: coin, error: error, status: 'rejected' }));
    });

    const assetPredictionPromises = selectedAssets.value.map(assetPair => {
        const payload = { asset_pair: assetPair, trainDays: trainDays.value, predictDays: predictDays.value, endDate: endDate.value, useSentiment: false }; // Sentiment выключен для валют
        return axios.post('http://localhost:8000/api/ETL/analyze/predict-asset/', payload)
            .then(response => ({ type: 'asset', name: assetPair, data: response.data, status: 'fulfilled' }))
            .catch(error => ({ type: 'asset', name: assetPair, error: error, status: 'rejected' }));
    });

    const stockPredictionPromises = selectedStocks.value.map(stockName => {
        const ticker = availableStocks.value[stockName]?.ticker;
        if (!ticker) {
            console.error(`Тикер для акции "${stockName}" не найден!`);
            return Promise.resolve({
                type: 'stock',
                name: stockName,
                status: 'rejected',
                error: { message: `Конфигурация для "${stockName}" не найдена.` }
            });
        }
        const payload = {
            ticker: ticker,
            trainDays: trainDays.value,
            predictDays: predictDays.value,
            endDate: endDate.value
        };
        return axios.post('http://localhost:8000/api/ETL/analyze/predict-stock/', payload)
            .then(response => ({ type: 'stock', name: stockName, data: response.data, status: 'fulfilled' }))
            .catch(error => ({ type: 'stock', name: stockName, error: error, status: 'rejected' }));
    });

    const allPromises = [...coinPredictionPromises, ...assetPredictionPromises, ...stockPredictionPromises];

    // 4. Выполнение и обработка всех обращений
    const results = await Promise.all(allPromises);

    results.forEach(res => {
        const targetName = res.name;
        // Случай 1: обращение отклонено (ошибка сети/сервера)
        if (res.status === 'rejected') {
            const msg = res.error.response?.data?.message || res.error.message || `Сетевая или серверная ошибка`;
            if (res.type === 'coin') predictionErrors.value[targetName] = msg;
            else if (res.type === 'asset') predictionAssetErrors.value[targetName] = msg;
            else if (res.type === 'stock') predictionStockErrors.value[targetName] = msg;
            return;
        }

        // Случай 2: обращение выполнено, но бэкенд вернул ошибку
        if (res.data.status === 'error') {
            const msg = res.data.message || 'Неизвестная ошибка на сервере';
            if (res.type === 'coin') predictionErrors.value[targetName] = msg;
            else if (res.type === 'asset') predictionAssetErrors.value[targetName] = msg;
            else if (res.type === 'stock') predictionStockErrors.value[targetName] = msg;
            return;
        }

        // Случай 3: Успешный результат
        if (res.data.status === 'success' && Array.isArray(res.data.predictions)) {
            const data = res.data.predictions.map(p => ({ ...p, date: new Date(p.date) })).sort((a, b) => a.date - b.date);
            if (res.type === 'coin') predictedPrices.value[targetName] = data;
            else if (res.type === 'asset') predictedAssetPrices.value[targetName] = data;
            else if (res.type === 'stock') predictedStockPrices.value[targetName] = data;
        } else {
            // Неожиданный, но не ошибочный формат
            const msg = "Неожиданный формат ответа от сервера.";
            if (res.type === 'coin') predictionErrors.value[targetName] = msg;
            else if (res.type === 'asset') predictionAssetErrors.value[targetName] = msg;
            else if (res.type === 'stock') predictionStockErrors.value[targetName] = msg;
        }
    });

    // 5. Завершение
    predicting.value = false;
    showPopup('Прогнозирование завершено.');
    console.log("Все запросы на прогнозирование обработаны.");
};
const triggerFileInput = () => { if (fileInput.value) { fileInput.value.value = ''; fileInput.value.click(); } };
const handleFileUpload = (event) => { const file = event.target.files[0]; if (!file) return; loading.value = true; clearPopups(); clearPredictions(); const reader = new FileReader(); reader.onload = () => { try { parseCSV(reader.result); } catch(e) { console.error("CSV Error:", e); showPopup(`CSV Error: ${e.message}`, true); } finally { loading.value = false; } }; reader.onerror = () => { console.error("File Read Error"); showPopup('Read Error.', true); loading.value = false; }; reader.readAsText(file); };
const parseCsvRow = (row) => {
    const result = [];
    const regex = /"([^"]*)"|([^,]+)/g;
    let match;
    while (match = regex.exec(row)) {
        result.push(match[1] !== undefined ? match[1].trim() : match[2].trim());
        if (regex.lastIndex < row.length && row[regex.lastIndex] === ',') {
            regex.lastIndex++;
        }
    }
    return result;
};
const parseCSV = (csvText) => {
    console.log("Разбор CSV (только криптовалюта)..."); const rows = csvText.split(/[\r\n]+/).filter(r => r.trim()); if (rows.length < 2) { showPopup("CSV пустой.", true); return; } const header = rows[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, '')); const isOld = header.includes("монета") && header.includes("дата") && header.includes("цена (usd)"); const isNew = header.includes("date") && header.includes("high") && header.includes("name"); let data = []; let errors = 0; const start = new Date(startDate.value); start.setUTCHours(0, 0, 0, 0); const end = new Date(endDate.value); end.setUTCHours(23, 59, 59, 999);
    if (isOld) {
        const cI = header.indexOf("монета"), dI = header.indexOf("дата"), pI = header.indexOf("цена (usd)");
        data = rows.slice(1).map(r => { const cols = parseCsvRow(r); if (cols.length <= Math.max(cI, dI, pI)) { errors++; return null; } let coin = cols[cI].toLowerCase(), dt = cols[dI], price = cols[pI]; if (!selectedCoins.value.includes(coin)) return null; const date = parseDate(dt.trim()); if (!date || date < start || date > end) return null; const p = parseFloat(price.replace(',', '.')); if (isNaN(p)) { errors++; return null; } return { name: coin, timestamp: date, price_usd: p }; }).filter(Boolean);
    } else if (isNew) {
        const dI = header.indexOf("date"), hI = header.indexOf("high"), nI = header.indexOf("name"); if (dI === -1 || hI === -1 || nI === -1) { showPopup("Ошибка CSV: не найдены дата, макс, имя.", true); return; }
        data = rows.slice(1).map(r => { const cols = parseCsvRow(r); if (cols.length <= Math.max(dI, hI, nI)) { errors++; return null; } const coin = cols[nI].toLowerCase(); if (!selectedCoins.value.includes(coin)) return null; const date = parseDate(cols[dI]); if (!date || date < start || date > end) return null; const p = parseFloat(cols[hI].replace(',', '.')); if (isNaN(p)) { errors++; return null; } return { name: coin, timestamp: date, price_usd: p }; }).filter(Boolean);
    } else { showPopup('Неизвестный формат CSV.', true); return; }
    console.log(`Валидных строк: ${data.length}. Ошибок разбора: ${errors}.`); const existing = new Set(cryptoPrices.value.map(p => `${p.name}-${p.timestamp.toISOString()}`)); const uniqueNew = data.filter(n => !existing.has(`${n.name}-${n.timestamp.toISOString()}`)); console.log(`Добавлено ${uniqueNew.length} уникальных записей.`);
    if (uniqueNew.length > 0) {
        cryptoPrices.value.push(...uniqueNew); cryptoPrices.value.sort((a, b) => a.timestamp - b.timestamp); updateChartData(); let msg = `Импортировано: ${uniqueNew.length}.`; if (errors > 0) msg += ` ${errors} ошибок в файле.`; showPopup(msg, false, 5000);
    } else { let msg = "Новых уникальных данных не найдено."; if (errors > 0) msg += ` ${errors} ошибок в файле.`; showPopup(msg, errors > 0); }
};
const parseDate = (dateString) => {
    if (!dateString) return null; let date; const isoAttempt = dateString.includes('T') ? dateString : dateString.replace(' ', 'T'); date = new Date(isoAttempt); if (!isNaN(date.getTime())) return date; const isoDateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (isoDateMatch) { date = new Date(Date.UTC(parseInt(isoDateMatch[1]), parseInt(isoDateMatch[2]) - 1, parseInt(isoDateMatch[3]))); if (!isNaN(date.getTime())) return date; } const matchRuDateTime = dateString.match(/(\d{2})\.(\d{2})\.(\d{4})[ ,T]*(\d{2})[:.](\d{2})[:.](\d{2})/); if (matchRuDateTime) { const isoStr = `${matchRuDateTime[3]}-${matchRuDateTime[2]}-${matchRuDateTime[1]}T${matchRuDateTime[4]}:${matchRuDateTime[5]}:${matchRuDateTime[6]}`; date = new Date(isoStr); if (!isNaN(date.getTime())) return date; } const matchRuDateOnly = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/); if (matchRuDateOnly) { const isoStr = `${matchRuDateOnly[3]}-${matchRuDateOnly[2]}-${matchRuDateOnly[1]}`; date = new Date(isoStr); if (!isNaN(date.getTime())) return date; date = new Date(parseInt(matchRuDateOnly[3]), parseInt(matchRuDateOnly[2]) - 1, parseInt(matchRuDateOnly[1])); if (!isNaN(date.getTime())) return date; } if (/^\d{10,13}(\.\d+)?$/.test(dateString)) { const ts = Number(dateString); const tsToUse = ts > 100000000000 ? ts : ts * 1000; date = new Date(tsToUse); if (!isNaN(date.getTime())) return date; } console.warn("Failed to parse date:", dateString); return null;
};
const exportToCSV = () => { const start = new Date(startDate.value); start.setUTCHours(0,0,0,0); const end = new Date(endDate.value); end.setUTCHours(23,59,59,999); const data = cryptoPrices.value.filter(c => selectedCoins.value.includes(c.name) && c.timestamp.getTime() >= start.getTime() && c.timestamp.getTime() <= end.getTime()); if (data.length === 0) { showPopup("No crypto data to export.", true); return; } const h = '"Криптовалюта","Дата","Цена (USD)"\n'; const r = data.map(c => `"${c.name.toUpperCase()}","${c.timestamp.toLocaleString('ru-RU',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'})}","${c.price_usd.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:8,useGrouping:false})}"`).join('\n'); const csv = '\uFEFF' + h + r; const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'}); const link = document.createElement('a'); if (link.download!==undefined) { const url = URL.createObjectURL(blob); const fn = `crypto_prices_${startDate.value}_to_${endDate.value}.csv`; link.setAttribute('href', url); link.setAttribute('download', fn); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); showPopup(`Crypto data exported: ${fn}`); } else { showPopup("CSV download not supported.", true); } };
const toggleAllCoins = () => { if (selectedCoins.value.length === availableCoins.value.length) selectedCoins.value = []; else selectedCoins.value = availableCoins.value.slice(); clearPredictions(); };
const toggleAllAssets = () => { if (selectedAssets.value.length === availableAssets.value.length) selectedAssets.value = []; else selectedAssets.value = availableAssets.value.slice(); clearPredictions(); };
const toggleAllStocks = () => {
    const allStockNames = Object.keys(availableStocks.value);
    if (selectedStocks.value.length === allStockNames.length) {
        selectedStocks.value = [];
    } else {
        selectedStocks.value = allStockNames;
    }
    clearPredictions();
};
const getRandomColor = (name) => { if (colorCache.value[name]) return colorCache.value[name]; const all = [...availableCoins.value, ...availableAssets.value, ...Object.keys(availableStocks.value)]; const idx = all.indexOf(name); const step = 360 / (all.length || 10); const hue = (idx * step + 15) % 360; const sat = 70 + Math.random() * 20; const lig = 50 + Math.random() * 10; const color = `hsl(${hue}, ${sat}%, ${lig}%)`; colorCache.value[name] = color; return color; };

onMounted(async () => {
  loading.value = true;
  await Promise.all([ fetchData(), fetchAssetData(), fetchStockData(), fetchNewsData() ]);
  loading.value = false;
});
</script>

<style scoped>
/* --- Общие контейнеры --- */
.prices-and-predictions { display: flex; gap: 30px; margin-bottom: 20px; flex-wrap: wrap; }
.latest-prices, .latest-asset-prices, .latest-stock-prices { flex: 1; min-width: 300px; border: 1px solid #eee; padding: 20px; border-radius: 8px; background-color: #fcfcfc; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.predicted-prices { margin-bottom: 20px; border: 1px solid #eee; padding: 20px; border-radius: 8px; background-color: #fcfcfc; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

.prediction-columns-container {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.prediction-column {
    flex: 1;
    min-width: 300px;
    background-color: #fcfcfc;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #eee;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.prediction-column h3 {
    margin-top: 0;
    font-size: 1.2em;
}

.crypto-predictions h3 { color: #007bff; }
.forex-predictions h3 { color: #17a2b8; }
.stock-predictions h3 { color: #28a745; }

.prediction-column > ul {
    list-style-type: none;
    padding-left: 0;
    margin: 0;
}

.prediction-column > ul > li {
    margin-bottom: 12px;
}

.prediction-column li > ul {
    list-style-type: none;
    margin-top: 8px;
    padding-left: 15px;
    font-size: 0.9em;
    color: #555;
}

.prediction-column li > ul > li {
    margin-bottom: 5px;
}

.prediction-placeholder {
    text-align: center;
    padding: 40px 200px;
}

.prediction-placeholder p {
    font-size: 1.3em;
    color: #6c757d;
    margin: 0;
}

.latest-prices h3 {
    color: #007bff;
    font-size: 1.2em;
}

.latest-asset-prices h3 {
    color: #17a2b8;
    font-size: 1.2em;
}

.latest-stock-prices h3 {
    color: #28a745;
    font-size: 1.2em;
}

.prediction-loading,
.prediction-placeholder {
    margin-bottom: 20px;
    border: 1px solid #eee;
    padding: 20px;
    border-radius: 8px;
    background-color: #fcfcfc;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100px;
    text-align: center;
}

/* --- Списки цен и прогнозов --- */
.latest-prices ul, .latest-asset-prices ul, .latest-stock-prices ul { list-style-type: none; padding-left: 0; margin: 0; }
.latest-prices > ul > li, .latest-asset-prices > ul > li, .latest-stock-prices > ul > li { margin-bottom: 12px; }
.latest-prices li > ul, .latest-asset-prices li > ul, .latest-stock-prices li > ul { margin-top: 6px; padding-left: 20px; font-size: 0.9em; color: #555; }
.latest-prices li > ul > li, .latest-asset-prices li > ul > li, .latest-stock-prices li > ul > li { margin-bottom: 4px; display: flex; align-items: center; flex-wrap: wrap; }
.toggle-list-button { cursor: pointer; color: #007bff; font-style: italic; margin-top: 8px; font-size: 0.9em; }
.toggle-list-button:hover { color: #0056b3; text-decoration: underline; }

.price-change { margin-left: 10px; font-size: 0.85em; font-weight: bold; padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
.price-change.positive { color: #1a8a44; background-color: #eaf6ec; }
.price-change.negative { color: #d3303e; background-color: #fce8e9; }

.prediction-loading { text-align: center; color: #666; padding: 20px; min-height: 100px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.spinner { border: 4px solid rgba(0, 0, 0, 0.1); width: 36px; height: 36px; border-radius: 50%; border-left-color: #6f42c1; animation: spin 1s ease infinite; margin-top: 10px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.prediction-tag { font-size: 0.8em; color: #28a745; margin-left: 5px; font-style: italic; font-weight: bold; }
.prediction-error-message { color: #dc3545; font-size: 0.9em; margin-top: 5px; border-left: 3px solid #dc3545; padding: 4px 8px; background-color: #f8d7da20; }
.error-details { font-size: 0.9em; color: #6c757d; display: block; margin-top: 3px; }
.prediction-info-message { font-size: 0.9em; color: #6c757d; margin-top: 5px; }
.error-header { color: #dc3545; }
.prediction-summary { font-size: 0.9em; padding: 4px 8px; margin-top: 8px; margin-bottom: 5px; border-radius: 5px; margin-left: 8px; display: inline-block; border: 1px solid transparent; }
.prediction-summary.positive { color: #1a8a44; background-color: #eaf6ec; border-color: #a3d9b1; }
.prediction-summary.negative { color: #d3303e; background-color: #fce8e9; border-color: #f3b6bc; }
.prediction-summary.neutral { color: #555; background-color: #f0f0f0; border-color: #ddd; }
.prediction-summary .summary-value { font-weight: bold; }

/* --- График --- */
.chart-container { height: 450px; width: 100%; position: relative; margin-bottom: 25px; border: 1px solid #eee; padding: 10px; border-radius: 8px; }
.chart-container p { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #666; font-size: 1.1em; }

/* --- Контейнер управления --- */
.controls-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin-bottom: 25px; padding: 25px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f8f9fa; }
.date-selector, .prediction-params, .coin-selector, .asset-selector, .stock-selector { display: flex; flex-direction: column; gap: 12px; }
.date-selector > label:first-of-type, .prediction-params > label:first-of-type, .coin-selector > label.select-all, .asset-selector > label.select-all, .stock-selector > label.select-all { font-weight: 600; font-size: 1.05em; margin-bottom: 8px; color: #343a40; border-bottom: 1px solid #dee2e6; padding-bottom: 8px; }
.controls-container label { font-size: 0.9em; color: #495057; margin-bottom: -5px; }
.controls-container .param-info { font-size: 0.8em; color: #6c757d; margin-top: -8px; }
.controls-container input[type="date"], .controls-container input[type="number"], .controls-container select { padding: 10px 12px; border: 1px solid #ced4da; border-radius: 5px; font-size: 1em; background-color: white; color: #495057; width: 100%; box-sizing: border-box; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
.controls-container input[type="number"] { max-width: 160px; }
.controls-container input[type="date"]:focus, .controls-container input[type="number"]:focus, .controls-container select:focus { border-color: #80bdff; outline: 0; box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25); }

/* --- Списки выбора --- */
.coin-selector .scrollable-list, .asset-selector .scrollable-list, .stock-selector .scrollable-list { display: flex; flex-direction: column; max-height: 186px; overflow-y: auto; border: 1px solid #ced4da; border-radius: 5px; padding: 8px; background-color: #fff; }
.coin-selector .scrollable-list::-webkit-scrollbar, .asset-selector .scrollable-list::-webkit-scrollbar, .stock-selector .scrollable-list::-webkit-scrollbar { width: 8px; }
.coin-selector .scrollable-list::-webkit-scrollbar-track, .asset-selector .scrollable-list::-webkit-scrollbar-track, .stock-selector .scrollable-list::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
.coin-selector .scrollable-list::-webkit-scrollbar-thumb, .asset-selector .scrollable-list::-webkit-scrollbar-thumb, .stock-selector .scrollable-list::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
.coin-selector .scrollable-list::-webkit-scrollbar-thumb:hover, .asset-selector .scrollable-list::-webkit-scrollbar-thumb:hover, .stock-selector .scrollable-list::-webkit-scrollbar-thumb:hover { background: #aaa; }
.coin-selector .checkbox-label, .asset-selector .checkbox-label, .stock-selector .checkbox-label { display: flex; align-items: center; gap: 10px; padding: 8px 10px; font-size: 0.95em; cursor: pointer; border-radius: 4px; transition: background-color 0.2s ease; user-select: none; }
.coin-selector .checkbox-label:hover, .asset-selector .checkbox-label:hover, .stock-selector .checkbox-label:hover { background-color: #e9ecef; }
.coin-selector .checkbox-label input[type="checkbox"], .asset-selector .checkbox-label input[type="checkbox"], .stock-selector .checkbox-label input[type="checkbox"] { width: 17px; height: 17px; cursor: pointer; margin-top: -1px; }
.coin-selector .checkbox-label input[type="checkbox"] { accent-color: #007bff; }
.asset-selector .checkbox-label input[type="checkbox"] { accent-color: #17a2b8; }
.stock-selector .checkbox-label input[type="checkbox"] { accent-color: #28a745; } /* <-- ДОБАВЛЕНО */
.coin-selector .checkbox-label.select-all, .asset-selector .checkbox-label.select-all, .stock-selector .checkbox-label.select-all { border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-bottom: 5px; font-weight: bold; }
.coin-selector input[type="checkbox"]:indeterminate, .asset-selector input[type="checkbox"]:indeterminate, .stock-selector input[type="checkbox"]:indeterminate { accent-color: #6c757d; }

.sentiment-controls { margin-top: 15px; padding: 15px; border-top: 1px solid #dee2e6; border-radius: 5px; background-color: #f8f9fa; }
.sentiment-toggle { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; }
.sentiment-toggle input[type="checkbox"] { width: 18px; height: 18px; }
.sentiment-toggle strong { font-weight: 600; font-size: 1em; color: #495057; }
.sentiment-inputs { display: flex; flex-direction: column; gap: 12px; padding-left: 26px; border-left: 3px solid #007bff; }
.sentiment-inputs label { font-size: 0.9em; margin-bottom: -5px; }
.sentiment-inputs input[type="number"] { max-width: 130px; }

.extra-controls { display: flex; justify-content: center; align-items: center; margin-top: 20px; margin-bottom: 10px; }
.extra-controls .checkbox-label { padding: 6px 12px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; font-size: 0.9em; cursor: pointer; display: flex; align-items: center; gap: 8px; user-select: none; }

/* --- Кнопки --- */
.button-container { text-align: center; margin-top: 15px; display: flex; justify-content: center; align-items: center; gap: 15px; flex-wrap: wrap; }
button { padding: 11px 24px; font-size: 1em; font-weight: 500; cursor: pointer; border: none; border-radius: 6px; background-color: #007bff; color: white; transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
button:hover:not(:disabled) { background-color: #0056b3; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); }
button:active:not(:disabled) { background-color: #004085; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); transform: translateY(1px); }
button:disabled { background-color: #a0cfff; color: #ffffff; cursor: not-allowed; opacity: 0.7; box-shadow: none; }
button.predict-button { background-color: #6f42c1; }
button.predict-button:hover:not(:disabled) { background-color: #5a32a3; }
button.predict-button:disabled { background-color: #b19cd9; }
button:nth-of-type(3) { background-color: #28a745; }
button:nth-of-type(3):hover:not(:disabled) { background-color: #1e7e34; }
button:nth-of-type(3):disabled { background-color: #94d3a2; }
button:nth-of-type(4) { background-color: #ffc107; color: #333; }
button:nth-of-type(4):hover:not(:disabled) { background-color: #d39e00; }
button:nth-of-type(4):disabled { background-color: #ffe083; }
button.delete-button { background-color: #dc3545; }
button.delete-button:hover:not(:disabled) { background-color: #c82333; }
button.delete-button:active:not(:disabled) { background-color: #bd2130; }
button.delete-button:disabled { background-color: #f0a2aa; }
button.utility-button { background-color: #6c757d; font-size: 0.92em; padding: 12.4px 23px; }
button.utility-button:hover:not(:disabled) { background-color: #5a6268; }
button.utility-button:disabled { background-color: #b1b5b8; }

/* --- Секция новостей --- */
.news-section { margin-top: 35px; padding: 25px; border: 1px solid #dee2e6; border-radius: 8px; background-color: #ffffff; }
.news-section h3 { margin: 0 0 20px 0; border-bottom: 2px solid #007bff; padding-bottom: 12px; color: #0056b3; font-size: 1.4em; }
.news-filters { display: flex; gap: 20px; margin-bottom: 25px; flex-wrap: wrap; padding: 20px; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; }
.news-filters > div { display: flex; flex-direction: column; gap: 6px; flex-grow: 1; min-width: 180px; }
.news-filters label { font-weight: 500; font-size: 0.9em; color: #495057; }
.news-filters select { padding: 9px 12px; border: 1px solid #ced4da; border-radius: 5px; width: 100%; box-sizing: border-box; }
.news-filters select[multiple] { min-height: 85px; }
.news-filters .filter-button { padding: 9px 20px; font-size: 0.95em; background-color: #28a745; flex-shrink: 0; height: 40px; align-self: flex-start; margin-top: 26px; }
.news-filters .filter-button:hover:not(:disabled) { background-color: #218838; }
.news-filters .filter-button:disabled { background-color: #94d3a2; }
.news-list-container { margin-top: 20px; }
.news-list { list-style-type: none; padding: 0; margin: 0; }
.news-item { border: 1px solid #e9ecef; border-radius: 6px; margin-bottom: 18px; padding: 18px 20px; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.06); transition: box-shadow 0.2s ease; }
.news-item:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.news-header { display: flex; align-items: center; gap: 12px 18px; font-size: 0.88em; color: #6c757d; margin-bottom: 10px; flex-wrap: wrap; border-bottom: 1px dashed #e0e0e0; padding-bottom: 8px; }
.news-date { font-weight: 500; flex-shrink: 0; }
.news-source { font-style: italic; white-space: nowrap; }
.sentiment-label { padding: 3px 10px; border-radius: 12px; font-weight: bold; color: white; font-size: 0.9em; text-transform: capitalize; line-height: 1.4; margin-left: auto; flex-shrink: 0; }
.sentiment-label.positive { background-color: #28a745; }
.sentiment-label.negative { background-color: #dc3545; }
.sentiment-label.neutral { background-color: #6c757d; }
.sentiment-label.skipped, .sentiment-label:not([class*="positive"]):not([class*="negative"]):not([class*="neutral"]) { background-color: #ffc107; color: #333; }
.sentiment-score { font-size: 0.9em; color: #888; flex-shrink: 0; }
.news-title { margin: 8px 0 10px 0; font-size: 1.2em; font-weight: 600; }
.news-title a { text-decoration: none; color: #0056b3; transition: color 0.2s ease; }
.news-title a:hover { color: #003d80; text-decoration: underline; }
.news-summary { font-size: 0.98em; color: #343a40; line-height: 1.55; margin-bottom: 12px; }
.news-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 0.85em; color: #6c757d; margin-top: 12px; border-top: 1px dashed #e0e0e0; padding-top: 10px; }
.relevant-coins { font-style: italic; }
.pagination-controls { text-align: center; margin-top: 25px; display: flex; justify-content: center; align-items: center; gap: 12px; }
.pagination-controls button { padding: 7px 14px; font-size: 0.9em; }
.pagination-controls span { font-size: 0.95em; color: #555; }

/* --- Прочее --- */
.error-message { color: #dc3545; border: 1px solid #f5c6cb; background-color: #f8d7da; padding: 10px 15px; border-radius: 5px; margin: 10px 0; }
.no-data-message { color: #6c757d; font-style: italic; text-align: center; padding: 15px; }
.loading-indicator { text-align: center; padding: 20px; color: #666; font-size: 1.1em; }
.popup { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); color: white; padding: 14px 28px; border-radius: 6px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25); font-size: 1em; font-weight: 500; z-index: 1050; opacity: 1; transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out; max-width: 80%; text-align: center; }
.popup.success { background-color: #28a745; }
.popup.error { background-color: #dc3545; }
.popup-enter-active, .popup-leave-active, .popup-error-enter-active, .popup-error-leave-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55); }
.popup-enter-from, .popup-leave-to, .popup-error-enter-from, .popup-error-leave-to { opacity: 0; transform: translate(-50%, 30px) scale(0.9); }

/*
.advanced-prediction-inputs,
.advanced-prediction-inputs .sentiment-controls,
.advanced-prediction-inputs .sentiment-inputs {
    border-left: none !important;
} */


.toggle-advanced-params {
    display: flex;
    align-items: center;
    gap: 8px;
}
.toggle-advanced-params input[type="checkbox"] { width: 18px; height: 18px; }
.toggle-advanced-params strong { font-weight: 600; font-size: 1em; color: #495057; }


/* Контейнер для всех расширенных настроек*/
.advanced-prediction-inputs {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background-color: #fff;
}

.advanced-prediction-inputs > label {
    font-size: 0.9em;
    margin-bottom: -5px;
}
.advanced-prediction-inputs > input[type="number"] {
    max-width: 130px;
}

/* Блок с настройками тональности */
.sentiment-controls {
    padding-top: 15px;
    border-top: 1px solid #e0e0e0;
    background-color: #fff;
}
.sentiment-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 15px;
}
.sentiment-toggle input[type="checkbox"] { width: 17px; height: 17px; }
.sentiment-toggle strong { font-weight: normal; font-size: 1em; }

/* Вложенный блок для инпута "Окно тональности" */
.sentiment-inputs {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-left: 25px;
}
.sentiment-inputs label {
    font-size: 0.9em;
    margin-bottom: -5px;
}
.sentiment-inputs input[type="number"] {
    max-width: 130px;
}

</style>
