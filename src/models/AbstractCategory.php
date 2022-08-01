<?php declare(strict_types=1);
/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012, 2022 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */

namespace Elabftw\Models;

use Elabftw\Elabftw\Db;
use Elabftw\Interfaces\CrudInterface;
use Elabftw\Traits\EntityTrait;
use Elabftw\Traits\SortableTrait;

/**
 * A category is a status for experiments and item type for db item
 */
abstract class AbstractCategory implements CrudInterface
{
    use SortableTrait;
    use EntityTrait;

    protected Db $Db;

    protected int $team;

    /**
     * Get all the things
     */
    abstract public function readAll(): array;
}
