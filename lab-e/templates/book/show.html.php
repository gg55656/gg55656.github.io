<?php

/** @var \App\Model\Book $book */
/** @var \App\Service\Router $router */

$title = 'Book Details';
$bodyClass = 'show';

ob_start(); ?>
    <h1><?= htmlspecialchars($book->getTitle(), ENT_QUOTES, "UTF-8") ?></h1>
    <article>
        <?= htmlspecialchars($book->getAuthor(), ENT_QUOTES, "UTF-8") ?>
    </article>

    <ul class="action-list">
        <li> <a href="<?= $router->generatePath('book-index') ?>">Back to list</a></li>
        <li><a href="<?= $router->generatePath('book-edit', ['id'=> $book->getId()]) ?>">Edit</a></li>
    </ul>
<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';
